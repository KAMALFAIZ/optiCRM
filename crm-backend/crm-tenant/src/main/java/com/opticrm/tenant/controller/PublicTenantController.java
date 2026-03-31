package com.opticrm.tenant.controller;

import com.opticrm.tenant.entity.SubscriptionPlan;
import com.opticrm.tenant.entity.Tenant;
import com.opticrm.tenant.license.LicenseService;
import com.opticrm.tenant.service.TenantService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Public endpoints (no authentication required).
 * Used for SaaS onboarding, on-premise setup, and plan listing.
 */
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicTenantController {

    private final TenantService tenantService;
    private final LicenseService licenseService;

    /** Liste les plans d'abonnement disponibles */
    @GetMapping("/subscription-plans")
    public ResponseEntity<List<SubscriptionPlan>> getPlans() {
        return ResponseEntity.ok(tenantService.getActivePlans());
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
        Tenant tenant = tenantService.createTenant(
                req.getSlug(), req.getCompanyName(), req.getAdminEmail(), req.getPlanId());
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
