package com.opticrm.tenant.config;

import com.opticrm.tenant.context.TenantContext;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import java.util.UUID;

/**
 * Configures Hibernate 6 discriminator-based multi-tenancy.
 * The CurrentTenantIdentifierResolver reads the tenant from TenantContext (ThreadLocal).
 * Hibernate uses this to automatically filter all @TenantId-annotated entities.
 */
@Slf4j
@Configuration
@EnableConfigurationProperties(DeploymentModeProperties.class)
public class TenantHibernateConfig {

    @Bean
    public CurrentTenantIdentifierResolver<UUID> currentTenantIdentifierResolver() {
        return new CurrentTenantIdentifierResolver<>() {

            private static final UUID DEFAULT_TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");

            @Override
            public UUID resolveCurrentTenantIdentifier() {
                UUID tenantId = TenantContext.get();
                if (tenantId == null) {
                    log.trace("No tenant in context, using default tenant");
                    return DEFAULT_TENANT;
                }
                return tenantId;
            }

            @Override
            public boolean validateExistingCurrentSessions() {
                return false;
            }
        };
    }
}
