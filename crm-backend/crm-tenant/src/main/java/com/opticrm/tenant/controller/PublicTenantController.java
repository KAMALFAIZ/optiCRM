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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Public endpoints (no authentication required).
 * Used for SaaS onboarding, on-premise setup, and plan listing.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicTenantController {

    private final TenantService tenantService;
    private final LicenseService licenseService;
    private final DatabaseProvisioningService provisioningService;
    private final TenantDataSourceManager dataSourceManager;

    @Value("${spring.datasource.url:jdbc:sqlserver://localhost;encrypt=false;trustServerCertificate=true}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:sa}")
    private String datasourceUsername;

    @Value("${spring.datasource.password:}")
    private String datasourcePassword;

    /** Liste les plans d'abonnement disponibles */
    @GetMapping("/subscription-plans")
    public ResponseEntity<List<SubscriptionPlan>> getPlans() {
        return ResponseEntity.ok(tenantService.getActivePlans());
    }

    /** Résout un slug vers les infos publiques du tenant (id, nom, logo, couleur) */
    @GetMapping("/tenants/resolve")
    public ResponseEntity<Map<String, Object>> resolveSlug(@RequestParam String slug) {
        Tenant tenant = tenantService.findBySlug(slug);
        if (tenant == null || tenant.getStatus() == Tenant.TenantStatus.CANCELLED) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of(
                "id", tenant.getId().toString(),
                "slug", tenant.getSlug(),
                "name", tenant.getName(),
                "logoUrl", tenant.getLogoUrl() != null ? tenant.getLogoUrl() : "",
                "primaryColor", tenant.getPrimaryColor() != null ? tenant.getPrimaryColor() : "#405189",
                "status", tenant.getStatus().name()
        ));
    }

    /** Vérifie la disponibilité d'un slug (sous-domaine) */
    @GetMapping("/tenants/check-slug")
    public ResponseEntity<Map<String, Boolean>> checkSlug(@RequestParam String slug) {
        return ResponseEntity.ok(Map.of("available", tenantService.isSlugAvailable(slug)));
    }

    /** Enregistrement SaaS (crée un nouveau tenant + utilisateur admin) */
    @PostMapping("/tenants/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody @Valid RegisterRequest req) {
        if (!tenantService.isSlugAvailable(req.getSlug())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", "Ce sous-domaine est déjà pris"));
        }
        // createTenant() commits the save — provision() runs after in its own transaction
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

    /** Statut de la configuration on-premise (pour le wizard de premier démarrage) */
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

    /** Crée les bases opticrm_system et opticrm_default si elles n'existent pas */
    @PostMapping("/init-databases")
    public ResponseEntity<Map<String, Object>> initDatabases() {
        List<String> created = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        String masterUrl = datasourceUrl.replaceAll("(?i)databaseName=[^;]+;?", "")
                + ";databaseName=master";

        String[] databases = {"opticrm_system", "opticrm_default"};
        try (Connection conn = DriverManager.getConnection(masterUrl, datasourceUsername, datasourcePassword);
             Statement stmt = conn.createStatement()) {
            for (String db : databases) {
                try {
                    stmt.execute(
                        "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'" + db + "') " +
                        "CREATE DATABASE [" + db + "]"
                    );
                    created.add(db);
                } catch (Exception e) {
                    errors.add(db + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", "Connexion impossible : " + e.getMessage()));
        }

        if (!errors.isEmpty()) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "created", created, "errors", errors));
        }
        return ResponseEntity.ok(Map.of("success", true, "databases", created));
    }

    // ── DTOs ────────────────────────────────────────────────────────────────

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
