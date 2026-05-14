package com.opticrm.tenant.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Controls whether the application runs as multi-tenant SaaS or single-tenant on-premise.
 * Set via environment variable: DEPLOYMENT_MODE=saas|onpremise
 */
@ConfigurationProperties(prefix = "app.deployment")
@Getter
@Setter
public class DeploymentModeProperties {

    /** Deployment mode. Defaults to ONPREMISE for safety. */
    private Mode mode = Mode.ONPREMISE;

    /** Root domain for SaaS subdomain extraction (e.g. "opticrm.ma") */
    private String rootDomain = "opticrm.ma";

    /**
     * On-premise default tenant ID (UUID).
     * Automatically populated from the database at startup.
     * Can be overridden via app.deployment.default-tenant-id env var.
     */
    private String defaultTenantId = "00000000-0000-0000-0000-000000000001";

    /** Comma-separated list of CORS allowed origins (used in on-premise mode) */
    private String corsAllowedOrigins = "http://localhost:3000,http://localhost:5173";

    public boolean isSaas() {
        return mode == Mode.SAAS;
    }

    public boolean isOnPremise() {
        return mode == Mode.ONPREMISE;
    }

    public enum Mode {
        SAAS, ONPREMISE
    }
}
