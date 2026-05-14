package com.opticrm.tenant.controller;

import com.opticrm.tenant.datasource.TenantDataSourceManager;
import com.opticrm.tenant.entity.Tenant;
import com.opticrm.tenant.service.DatabaseProvisioningService;
import com.opticrm.tenant.service.TenantService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Super-admin endpoints pour la gestion des tenants SaaS.
 * Requiert ROLE_SUPER_ADMIN. Le filtre tenant n'est pas appliqué ici.
 */
@RestController
@RequestMapping("/api/v1/superadmin/tenants")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
public class TenantAdminController {

    private final TenantService tenantService;
    private final DatabaseProvisioningService provisioningService;
    private final TenantDataSourceManager dataSourceManager;

    @GetMapping
    public ResponseEntity<List<TenantDto>> listAll() {
        return ResponseEntity.ok(
            tenantService.getAllTenants().stream()
                .map(TenantDto::from)
                .collect(Collectors.toList())
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<TenantDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(TenantDto.from(tenantService.getById(id)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(
            @PathVariable UUID id,
            @RequestParam Tenant.TenantStatus status) {
        tenantService.updateStatus(id, status);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTenant(@PathVariable UUID id) {
        tenantService.deleteTenant(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Provisionne (ou re-provisionne) la base de données dédiée du tenant.
     * Crée opticrm_{slug} et exécute toutes les migrations Flyway.
     */
    @PostMapping("/{id}/provision-database")
    public ResponseEntity<Map<String, Object>> provisionDatabase(@PathVariable UUID id) {
        try {
            Tenant tenant = provisioningService.provision(id);
            dataSourceManager.register(tenant.getId(), tenant.getDbName());
            return ResponseEntity.ok(Map.of(
                "success",  true,
                "dbName",   tenant.getDbName(),
                "provisionedAt", tenant.getDbProvisionedAt().toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error",   e.getMessage()
            ));
        }
    }

    // ── DTO ─────────────────────────────────────────────────────────────────

    @Data
    public static class TenantDto {
        private UUID    id;
        private String  slug;
        private String  name;
        private String  status;
        private String  planName;
        private String  adminEmail;
        private boolean dbProvisioned;
        private String  dbName;
        private Instant dbProvisionedAt;
        private Instant createdAt;

        static TenantDto from(Tenant t) {
            TenantDto dto = new TenantDto();
            dto.id              = t.getId();
            dto.slug            = t.getSlug();
            dto.name            = t.getName();
            dto.status          = t.getStatus().name();
            dto.planName        = t.getPlan() != null ? t.getPlan().getName() : null;
            dto.adminEmail      = t.getAdminEmail();
            dto.dbProvisioned   = Boolean.TRUE.equals(t.getDbProvisioned());
            dto.dbName          = t.getDbName();
            dto.dbProvisionedAt = t.getDbProvisionedAt();
            dto.createdAt       = t.getCreatedAt();
            return dto;
        }
    }
}
