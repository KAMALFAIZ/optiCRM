package com.opticrm.tenant.controller;

import com.opticrm.tenant.entity.Tenant;
import com.opticrm.tenant.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Super-admin endpoints for managing tenants (SaaS backoffice).
 * Requires ROLE_SUPER_ADMIN. The tenant filter is NOT applied here
 * because super admins operate across all tenants.
 */
@RestController
@RequestMapping("/api/v1/superadmin/tenants")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
public class TenantAdminController {

    private final TenantService tenantService;

    @GetMapping
    public ResponseEntity<List<Tenant>> listAll() {
        return ResponseEntity.ok(tenantService.getAllTenants());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tenant> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(tenantService.getById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Tenant> updateStatus(
            @PathVariable UUID id,
            @RequestParam Tenant.TenantStatus status) {
        return ResponseEntity.ok(tenantService.updateStatus(id, status));
    }
}
