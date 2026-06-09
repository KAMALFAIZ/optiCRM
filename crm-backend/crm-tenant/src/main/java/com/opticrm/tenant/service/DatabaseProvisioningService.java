package com.opticrm.tenant.service;

import com.opticrm.tenant.entity.Tenant;
import com.opticrm.tenant.exception.TenantNotFoundException;
import com.opticrm.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.util.UUID;

/**
 * Provisionne une base de données SQL Server dédiée pour chaque client SaaS.
 *
 * Architecture database-per-tenant :
 *   opticrm_system  → tables système (tenants, subscription_plans, license_keys)
 *   opticrm_{slug}  → données métier du client (contacts, comptes, leads, etc.)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DatabaseProvisioningService {

    private final TenantRepository tenantRepository;

    @Value("${spring.datasource.url}")
    private String baseUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    // ── API publique ────────────────────────────────────────────────────────

    /**
     * Crée et migre la base opticrm_{slug} pour le tenant donné.
     * Met à jour tenant.dbName, dbProvisioned, dbProvisionedAt.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Tenant provision(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new TenantNotFoundException(tenantId.toString()));

        if (Boolean.TRUE.equals(tenant.getDbProvisioned())) {
            log.info("Tenant {} already provisioned on {}", tenant.getSlug(), tenant.getDbName());
            return tenant;
        }

        String dbName = buildDbName(tenant.getSlug());
        log.info("Provisioning database '{}' for tenant '{}'", dbName, tenant.getSlug());

        createDatabase(dbName);
        runMigrations(dbName);

        tenant.setDbName(dbName);
        tenant.setDbProvisioned(true);
        tenant.setDbProvisionedAt(Instant.now());
        Tenant saved = tenantRepository.save(tenant);

        log.info("Database '{}' provisioned successfully for tenant '{}'", dbName, tenant.getSlug());
        return saved;
    }

    /** Construit l'URL JDBC pour une base donnée (remplace databaseName=). */
    public String buildJdbcUrl(String dbName) {
        return baseUrl.replaceAll("(?i)databaseName=[^;]+", "databaseName=" + dbName);
    }

    // ── Helpers privés ──────────────────────────────────────────────────────

    /** Nom SQL Server : opticrm_{slug} (alphanumérique + underscore). */
    static String buildDbName(String slug) {
        return "opticrm_" + slug.toLowerCase().replaceAll("[^a-z0-9]", "_");
    }

    private void createDatabase(String dbName) {
        validateDbName(dbName);
        String masterUrl = baseUrl.replaceAll("(?i)databaseName=[^;]+;?", "") + ";databaseName=master";
        try (Connection conn = DriverManager.getConnection(masterUrl, username, password);
             PreparedStatement check = conn.prepareStatement(
                     "SELECT COUNT(*) FROM sys.databases WHERE name = ?")) {
            check.setString(1, dbName);
            try (var rs = check.executeQuery()) {
                rs.next();
                if (rs.getInt(1) == 0) {
                    // CREATE DATABASE does not support parameterized names — dbName is validated above
                    try (Statement stmt = conn.createStatement()) {
                        stmt.execute("CREATE DATABASE [" + dbName + "]");
                    }
                }
            }
            log.debug("SQL Server database '{}' created (or already existed)", dbName);
        } catch (SQLException e) {
            throw new RuntimeException("Impossible de créer la base de données '" + dbName + "'", e);
        }
    }

    private static void validateDbName(String dbName) {
        if (dbName == null || !dbName.matches("^[a-z0-9_]{3,128}$")) {
            throw new IllegalArgumentException("Nom de base de données invalide : " + dbName);
        }
    }

    private void runMigrations(String dbName) {
        validateDbName(dbName);
        String tenantUrl = buildJdbcUrl(dbName);
        Flyway schema = Flyway.configure()
                .dataSource(tenantUrl, username, password)
                .locations("classpath:db/tenant-migration")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .outOfOrder(false)
                .load();
        int schemaApplied = schema.migrate().migrationsExecuted;
        log.info("Tenant schema applied {} script(s) to '{}'", schemaApplied, dbName);

        // Baseline at V79 (last existing migration) so future V80+ migrations apply normally
        Flyway baseline = Flyway.configure()
                .dataSource(tenantUrl, username, password)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("79")
                .outOfOrder(true)
                .load();
        baseline.baseline();
        log.info("Baseline set at V79 for '{}'", dbName);
    }
}
