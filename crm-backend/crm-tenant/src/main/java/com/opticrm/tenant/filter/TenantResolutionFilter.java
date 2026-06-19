package com.opticrm.tenant.filter;

import com.opticrm.tenant.config.DeploymentModeProperties;
import com.opticrm.tenant.context.TenantContext;
import com.opticrm.tenant.repository.TenantRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Resolves the current tenant at the beginning of each HTTP request.
 *
 * Resolution strategy (first match wins):
 *   1. Header X-Tenant-ID (highest priority, used by frontend SPA)
 *   2. Subdomain (SaaS mode only): Host: acme.kasoft.ma → slug=acme
 *   3. Default tenant (on-premise mode)
 *
 * Always clears TenantContext in a finally block to prevent ThreadLocal leaks.
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE) // Must run before Spring Security FilterChainProxy (order -100)
@RequiredArgsConstructor
public class TenantResolutionFilter extends OncePerRequestFilter {

    private static final String TENANT_HEADER = "X-Tenant-ID";

    private final DeploymentModeProperties deploymentProps;
    private final TenantRepository tenantRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            UUID tenantId = resolveTenant(request);
            if (tenantId != null) {
                TenantContext.set(tenantId);
                log.trace("Tenant resolved: {} for {}", tenantId, request.getRequestURI());
            }
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private UUID resolveTenant(HttpServletRequest request) {
        // 1. Check explicit header (works in both modes, used by frontend)
        String headerTenantId = request.getHeader(TENANT_HEADER);
        if (headerTenantId != null && !headerTenantId.isBlank()) {
            try {
                return UUID.fromString(headerTenantId);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid X-Tenant-ID header value: {}", headerTenantId);
            }
        }

        // 2. SaaS mode: extract subdomain from Host header (routing par {client}.kasoft.ma)
        if (deploymentProps.isSaas()) {
            UUID fromSubdomain = resolveFromSubdomain(request);
            if (fromSubdomain != null) return fromSubdomain;
        }

        // 3. On-premise: always use the default (single) tenant
        if (deploymentProps.isOnPremise()) {
            try {
                return UUID.fromString(deploymentProps.getDefaultTenantId());
            } catch (IllegalArgumentException e) {
                log.error("Invalid default-tenant-id configured: {}", deploymentProps.getDefaultTenantId());
            }
        }

        return null;
    }

    private UUID resolveFromSubdomain(HttpServletRequest request) {
        // Check X-Forwarded-Host first (behind nginx/load balancer)
        String host = request.getHeader("X-Forwarded-Host");
        if (host == null || host.isBlank()) {
            host = request.getHeader("Host");
        }
        if (host == null || host.isBlank()) return null;

        // Strip port if present
        int colonIdx = host.indexOf(':');
        if (colonIdx > 0) host = host.substring(0, colonIdx);

        String rootDomain = deploymentProps.getRootDomain();
        if (!host.endsWith("." + rootDomain)) return null;

        String slug = host.substring(0, host.length() - rootDomain.length() - 1);
        if (slug.isBlank() || slug.equalsIgnoreCase("www") || slug.equalsIgnoreCase("app")) {
            return null; // Public/landing page — no tenant context
        }

        return tenantRepository.findBySlug(slug)
                .filter(t -> t.getStatus() != com.opticrm.tenant.entity.Tenant.TenantStatus.CANCELLED)
                .map(com.opticrm.tenant.entity.Tenant::getId)
                .orElse(null);
    }
}
