package com.opticrm.tenant.controller;

import com.opticrm.tenant.datasource.TenantDataSourceManager;
import com.opticrm.tenant.entity.SubscriptionPlan;
import com.opticrm.tenant.entity.Tenant;
import com.opticrm.tenant.license.LicenseService;
import com.opticrm.tenant.service.DatabaseProvisioningService;
import com.opticrm.tenant.service.TenantService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.util.List;
import java.util.Map;

/**
 * Public endpoints (no authentication required).
 * Used for SaaS onboarding, on-premise setup, and plan listing.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/public")
public class PublicTenantController {

    private final TenantService tenantService;
    private final LicenseService licenseService;
    private final DatabaseProvisioningService provisioningService;
    private final TenantDataSourceManager dataSourceManager;
    private final DataSource systemDataSource;

    public PublicTenantController(TenantService tenantService,
                                  LicenseService licenseService,
                                  DatabaseProvisioningService provisioningService,
                                  TenantDataSourceManager dataSourceManager,
                                  @Qualifier("systemDataSource") DataSource systemDataSource) {
        this.tenantService = tenantService;
        this.licenseService = licenseService;
        this.provisioningService = provisioningService;
        this.dataSourceManager = dataSourceManager;
        this.systemDataSource = systemDataSource;
    }

    @GetMapping("/subscription-plans")
    public ResponseEntity<List<SubscriptionPlan>> getPlans() {
        return ResponseEntity.ok(tenantService.getActivePlans());
    }

    @GetMapping("/tenants/resolve")
    public ResponseEntity<Map<String, Object>> resolveSlug(@RequestParam String slug) {
        Tenant tenant = tenantService.findBySlug(slug);
        if (tenant == null || tenant.getStatus() == Tenant.TenantStatus.CANCELLED) {
            return ResponseEntity.notFound().build();
        }

        String demoEmail = findAdminEmail(tenant);
        if (demoEmail == null || demoEmail.isBlank()) {
            demoEmail = tenant.getAdminEmail() != null ? tenant.getAdminEmail() : "";
        }

        return ResponseEntity.ok(Map.of(
                "id", tenant.getId().toString(),
                "slug", tenant.getSlug(),
                "name", tenant.getName(),
                "logoUrl", tenant.getLogoUrl() != null ? tenant.getLogoUrl() : "",
                "primaryColor", tenant.getPrimaryColor() != null ? tenant.getPrimaryColor() : "#405189",
                "status", tenant.getStatus().name(),
                "adminEmail", demoEmail
        ));
    }

    @GetMapping("/tenants/check-slug")
    public ResponseEntity<Map<String, Boolean>> checkSlug(@RequestParam String slug) {
        return ResponseEntity.ok(Map.of("available", tenantService.isSlugAvailable(slug)));
    }

    @PostMapping("/tenants/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody @Valid RegisterRequest req) {
        if (!tenantService.isSlugAvailable(req.getSlug())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", "Ce sous-domaine est déjà pris"));
        }
        Tenant tenant = tenantService.createTenant(
                req.getSlug(), req.getCompanyName(), req.getAdminEmail(), req.getPlanId());
        try {
            tenant = provisioningService.provision(tenant.getId());
            dataSourceManager.register(tenant.getId(), tenant.getDbName());
        } catch (Exception e) {
            log.warn("Auto-provisioning failed for tenant '{}': {}", req.getSlug(), e.getMessage());
        }
        return ResponseEntity.ok(Map.of(
                "success", true,
                "tenantId", tenant.getId().toString(),
                "slug", tenant.getSlug()
        ));
    }

    @GetMapping("/setup-status")
    public ResponseEntity<Map<String, Object>> setupStatus() {
        LicenseService.LicenseStatus status = licenseService.getStatus();
        boolean configured = status != LicenseService.LicenseStatus.NOT_CONFIGURED;
        return ResponseEntity.ok(Map.of(
                "configured", configured,
                "licenseStatus", status.name(),
                "message", licenseService.getStatusMessage()
        ));
    }

    /**
     * Finds admin email for a tenant by querying the correct database.
     * Uses the tenant's own DataSource if provisioned, otherwise falls back to system DB.
     */
    private String findAdminEmail(Tenant tenant) {
        DataSource ds = null;
        if (Boolean.TRUE.equals(tenant.getDbProvisioned())) {
            ds = dataSourceManager.getDataSource(tenant.getId());
        }
        if (ds == null) {
            ds = systemDataSource;
        }

        try {
            JdbcTemplate jdbc = new JdbcTemplate(ds);
            return jdbc.queryForObject(
                    "SELECT TOP 1 u.email FROM users u " +
                    "JOIN roles r ON r.id = u.role_id " +
                    "WHERE u.tenant_id = ? AND u.is_active = 1 AND r.name = 'SUPER_ADMIN' " +
                    "ORDER BY u.email",
                    String.class,
                    tenant.getId());
        } catch (Exception e) {
            log.debug("No SUPER_ADMIN found for tenant {}: {}", tenant.getSlug(), e.getMessage());
            return null;
        }
    }

    @Data
    public static class RegisterRequest {
        @NotBlank
        @Pattern(regexp = "^[a-z0-9-]{3,50}$",
                 message = "Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets (3-50 caractères)")
        private String slug;

        @NotBlank
        @Size(min = 2, max = 255)
        private String companyName;

        @NotBlank
        @Email
        private String adminEmail;

        @NotBlank
        private String planId;
    }
}
