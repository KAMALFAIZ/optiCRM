package com.opticrm.tenant.datasource;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Gère un pool de DataSources Hikari — un par tenant provisionné.
 *
 * Au démarrage, charge tous les tenants provisionnés depuis la base système
 * via JDBC pur (pas JPA) pour éviter toute dépendance circulaire.
 * Quand un nouveau tenant est provisionné, {@link #register} ajoute son DataSource.
 */
@Slf4j
@Component
public class TenantDataSourceManager {

    @Value("${spring.datasource.url}")
    private String baseUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    /** UUID → DataSource Hikari dédié */
    private final ConcurrentHashMap<UUID, DataSource> pool = new ConcurrentHashMap<>();

    // ── Initialisation au démarrage ─────────────────────────────────────────

    @PostConstruct
    public void loadProvisionedTenants() {
        String sql = "SELECT id, db_name FROM tenants WHERE db_provisioned = 1 AND db_name IS NOT NULL";
        try (Connection conn = systemConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            int count = 0;
            while (rs.next()) {
                UUID id  = UUID.fromString(rs.getString("id"));
                String dbName = rs.getString("db_name");
                pool.put(id, buildDataSource(dbName, dbName));
                count++;
            }
            log.info("TenantDataSourceManager: {} tenant datasource(s) loaded at startup", count);
        } catch (SQLException e) {
            // La table n'existe peut-être pas encore (première migration)
            log.warn("Could not pre-load tenant datasources: {}", e.getMessage());
        }
    }

    // ── API ─────────────────────────────────────────────────────────────────

    /** Enregistre un nouveau DataSource après provisioning. */
    public void register(UUID tenantId, String dbName) {
        pool.computeIfAbsent(tenantId, id -> buildDataSource(dbName, dbName));
        log.info("Registered DataSource for tenant {} → {}", tenantId, dbName);
    }

    /** Retourne le DataSource du tenant, ou null s'il n'est pas encore provisionné. */
    public DataSource getDataSource(UUID tenantId) {
        return pool.get(tenantId);
    }

    /** Toutes les clés + DataSources (utilisé par TenantRoutingDataSource). */
    public Map<UUID, DataSource> getAll() {
        return Map.copyOf(pool);
    }

    // ── Helpers privés ──────────────────────────────────────────────────────

    private DataSource buildDataSource(String dbName, String poolName) {
        String url = baseUrl.replaceAll("(?i)databaseName=[^;]+", "databaseName=" + dbName);
        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl(url);
        cfg.setUsername(username);
        cfg.setPassword(password);
        cfg.setMaximumPoolSize(20);
        cfg.setMinimumIdle(2);
        cfg.setConnectionTimeout(30_000);
        cfg.setIdleTimeout(300_000);
        cfg.setMaxLifetime(900_000);
        cfg.setConnectionInitSql("SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON");
        cfg.setPoolName("tenant-" + poolName);
        log.debug("Creating HikariCP pool '{}' → {}", cfg.getPoolName(), url);
        return new HikariDataSource(cfg);
    }

    /** Connexion JDBC directe à la base principale (système) — sans passer par Hibernate. */
    private Connection systemConnection() throws SQLException {
        return java.sql.DriverManager.getConnection(baseUrl, username, password);
    }
}
