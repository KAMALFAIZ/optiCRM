package com.opticrm.tenant.datasource;

import com.opticrm.tenant.context.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.datasource.AbstractDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.UUID;

/**
 * DataSource Spring qui route chaque connexion JDBC vers la base du tenant actif.
 *
 * Stratégie :
 *   1. TenantContext contient l'UUID du tenant courant (posé par TenantResolutionFilter)
 *   2. TenantDataSourceManager fournit le DataSource Hikari correspondant
 *   3. Fallback → systemDataSource (base principale) si le tenant n'est pas encore provisionné
 *
 * Dynamique : chaque appel consulte TenantDataSourceManager, donc les nouveaux
 * tenants provisionnés en cours d'exécution sont immédiatement routés.
 */
@Slf4j
@RequiredArgsConstructor
public class TenantRoutingDataSource extends AbstractDataSource {

    private final DataSource systemDataSource;
    private final TenantDataSourceManager manager;

    @Override
    public Connection getConnection() throws SQLException {
        return resolve().getConnection();
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return resolve().getConnection(username, password);
    }

    private DataSource resolve() {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            return systemDataSource;
        }
        DataSource ds = manager.getDataSource(tenantId);
        if (ds == null) {
            log.debug("No DataSource for tenant {}, falling back to system DB", tenantId);
            return systemDataSource;
        }
        return ds;
    }
}
