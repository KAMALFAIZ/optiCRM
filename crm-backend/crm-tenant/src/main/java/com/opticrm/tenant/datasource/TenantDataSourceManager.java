package com.opticrm.tenant.datasource;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
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
 * Au démarrage, charge tous les tenants provisionnés depuis la base système.
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

    private final DataSource systemDataSource;

    private final ConcurrentHashMap<UUID, DataSource> pool = new ConcurrentHashMap<>();

    public TenantDataSourceManager(@Qualifier("systemDataSource") DataSource systemDataSource) {
        this.systemDataSource = systemDataSource;
    }

    @PostConstruct
    public void loadProvisionedTenants() {
        // Un tenant suspendu ou resilie ne doit pas ouvrir de pool : updateStatus() le
        // deregistre a chaud, la requete de demarrage applique la meme regle a froid.
        String sql = """
                SELECT id, db_name FROM tenants
                WHERE db_provisioned = 1
                  AND db_name IS NOT NULL
                  AND status NOT IN ('SUSPENDED', 'CANCELLED')
                """;
        try (Connection conn = systemDataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            int count = 0;
            int failed = 0;
            while (rs.next()) {
                UUID id = UUID.fromString(rs.getString("id"));
                String dbName = rs.getString("db_name");
                // Hikari ouvre une connexion des la construction (minimumIdle >= 1) et leve une
                // PoolInitializationException — une RuntimeException — si la base est absente ou
                // inaccessible. Sans ce catch, un seul tenant casse empeche TOUTE l'application
                // de demarrer. On isole donc chaque tenant : les autres restent servis.
                try {
                    pool.put(id, buildDataSource(dbName, dbName));
                    count++;
                } catch (RuntimeException e) {
                    failed++;
                    log.error("Tenant {} ignore au demarrage : base '{}' inaccessible ({}). "
                                    + "Les requetes de ce tenant echoueront tant que la base n'est pas retablie.",
                            id, dbName, e.getMessage());
                }
            }
            log.info("TenantDataSourceManager: {} tenant datasource(s) loaded at startup, {} en echec", count, failed);
        } catch (SQLException e) {
            log.warn("Could not pre-load tenant datasources: {}", e.getMessage());
        }
    }

    public void register(UUID tenantId, String dbName) {
        pool.computeIfAbsent(tenantId, id -> buildDataSource(dbName, dbName));
        log.info("Registered DataSource for tenant {} → {}", tenantId, dbName);
    }

    public void deregister(UUID tenantId) {
        DataSource ds = pool.remove(tenantId);
        if (ds instanceof HikariDataSource hikari) {
            hikari.close();
            log.info("Closed DataSource for tenant {}", tenantId);
        }
    }

    public DataSource getDataSource(UUID tenantId) {
        return pool.get(tenantId);
    }

    public Map<UUID, DataSource> getAll() {
        return Map.copyOf(pool);
    }

    private DataSource buildDataSource(String dbName, String poolName) {
        String url = baseUrl.replaceAll("(?i)databaseName=[^;]+", "databaseName=" + dbName);
        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl(url);
        cfg.setUsername(username);
        cfg.setPassword(password);
        cfg.setMaximumPoolSize(5);
        cfg.setMinimumIdle(1);
        cfg.setConnectionTimeout(30_000);
        cfg.setIdleTimeout(300_000);
        cfg.setMaxLifetime(900_000);
        cfg.setConnectionInitSql("SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON");
        cfg.setPoolName("tenant-" + poolName);
        log.debug("Creating HikariCP pool '{}' → {}", cfg.getPoolName(), url);
        return new HikariDataSource(cfg);
    }
}
