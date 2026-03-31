package com.opticrm.api.migration;

/**
 * NOTE: No Spring DataSource bean is created for the SQL Server source.
 * The connection is created on-demand inside DataMigrationService using DriverManager
 * to avoid Flyway auto-configuration conflicts (Flyway would try to run on SQL Server).
 *
 * Configuration is read from application.yml under:
 *   migration.source.enabled / url / username / password
 */
public class MigrationSourceConfig {
    // Intentionally empty — connection managed in DataMigrationService
}
