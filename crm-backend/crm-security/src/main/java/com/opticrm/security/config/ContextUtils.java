package com.opticrm.security.config;

import com.opticrm.security.dto.UserPrincipal;
import com.opticrm.tenant.context.TenantContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

public final class ContextUtils {

    private ContextUtils() {}

    public static Optional<UserPrincipal> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() &&
                authentication.getPrincipal() instanceof UserPrincipal) {
            return Optional.of((UserPrincipal) authentication.getPrincipal());
        }
        return Optional.empty();
    }

    public static Optional<UUID> getCurrentUserId() {
        return getCurrentUser().map(UserPrincipal::getId);
    }

    public static Optional<String> getCurrentUserEmail() {
        return getCurrentUser().map(UserPrincipal::getEmail);
    }

    public static Optional<UUID> getCurrentTenantId() {
        // JWT-authenticated requests: read from UserPrincipal
        Optional<UUID> fromPrincipal = getCurrentUser().map(UserPrincipal::getTenantId);
        if (fromPrincipal.isPresent()) return fromPrincipal;
        // Public/unauthenticated requests: read from TenantContext (set by TenantResolutionFilter)
        return Optional.ofNullable(TenantContext.get());
    }

    public static boolean hasPermission(String module, String action) {
        return getCurrentUser()
                .map(user -> user.hasPermission(module, action))
                .orElse(false);
    }

    public static boolean hasRole(String role) {
        return getCurrentUser()
                .map(user -> user.hasRole(role))
                .orElse(false);
    }

    public static boolean isAdmin() {
        return getCurrentUser().map(UserPrincipal::isAdmin).orElse(false);
    }

    public static boolean isManager() {
        return getCurrentUser().map(UserPrincipal::isManager).orElse(false);
    }

    public static boolean isSuperAdmin() {
        return getCurrentUser().map(u -> u.hasRole("SUPER_ADMIN")).orElse(false);
    }

    public static Optional<UUID> getCurrentTeamId() {
        return getCurrentUser().map(UserPrincipal::getTeamId);
    }

    public static Optional<UUID> getCurrentTerritoryId() {
        return getCurrentUser().map(UserPrincipal::getTerritoryId);
    }
}
