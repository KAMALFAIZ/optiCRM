package com.opticrm.core.objectives.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.core.objectives.dto.*;
import com.opticrm.core.objectives.service.ObjectivesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/objectives")
@RequiredArgsConstructor
public class ObjectivesController {

    private final ObjectivesService service;

    // ── Objectifs ────────────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL','READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<ObjectiveDto>>> listObjectives(
            @RequestParam int year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(service.listObjectives(year, month, userId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ObjectiveDto>> upsertObjective(
            @Valid @RequestBody CreateObjectiveRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.upsertObjective(req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<Void>> deleteObjective(@PathVariable UUID id) {
        service.deleteObjective(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── Ventes ───────────────────────────────────────────────────────────────

    @GetMapping("/sales")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL','READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<SaleEntryDto>>> listSales(
            @RequestParam int year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) UUID productId) {
        return ResponseEntity.ok(ApiResponse.success(service.listSales(year, month, userId, productId)));
    }

    @PostMapping("/sales")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<SaleEntryDto>> createSale(
            @Valid @RequestBody CreateSaleEntryRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.createSale(req)));
    }

    @PutMapping("/sales/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<SaleEntryDto>> updateSale(
            @PathVariable UUID id,
            @Valid @RequestBody CreateSaleEntryRequest req) {
        return ResponseEntity.ok(ApiResponse.success(service.updateSale(id, req)));
    }

    @DeleteMapping("/sales/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<Void>> deleteSale(@PathVariable UUID id) {
        service.deleteSale(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── Tracking KPI ─────────────────────────────────────────────────────────

    @GetMapping("/tracking")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL','READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<ObjectiveTrackingDto>>> getTracking(
            @RequestParam int year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) UUID userId) {
        return ResponseEntity.ok(ApiResponse.success(service.getTracking(year, month, userId)));
    }
}
