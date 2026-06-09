package com.opticrm.tenant.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

/**
 * Multi-tenancy configuration.
 * Database-per-tenant: routing is handled by TenantRoutingDataSource.
 * Hibernate discriminator is NOT used — each tenant has its own database.
 */
@Configuration
@EnableConfigurationProperties(DeploymentModeProperties.class)
public class TenantHibernateConfig {
}
