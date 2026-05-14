package com.opticrm.tenant.context;

import java.util.UUID;

/**
 * ThreadLocal holder for the current tenant identifier.
 * Set by TenantResolutionFilter at the start of each HTTP request
 * and cleared in a finally block.
 */
public final class TenantContext {

    private static final ThreadLocal<UUID> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(UUID tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static UUID get() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }

    public static boolean isPresent() {
        return CURRENT_TENANT.get() != null;
    }
}
