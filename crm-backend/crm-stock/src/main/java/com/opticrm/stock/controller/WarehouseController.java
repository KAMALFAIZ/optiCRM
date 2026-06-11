package com.opticrm.stock.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.stock.dto.CreateWarehouseRequest;
import com.opticrm.stock.dto.WarehouseDto;
import com.opticrm.stock.service.WarehouseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<WarehouseDto>>> list() {
        List<WarehouseDto> warehouses = warehouseService.list();
        return ResponseEntity.ok(ApiResponse.success(warehouses));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<WarehouseDto>>> listActive() {
        List<WarehouseDto> warehouses = warehouseService.listActive();
        return ResponseEntity.ok(ApiResponse.success(warehouses));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<WarehouseDto>>> search(
            @RequestParam String q
    ) {
        List<WarehouseDto> warehouses = warehouseService.search(q);
        return ResponseEntity.ok(ApiResponse.success(warehouses));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<WarehouseDto>> getById(@PathVariable UUID id) {
        WarehouseDto warehouse = warehouseService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(warehouse));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<WarehouseDto>> create(
            @Valid @RequestBody CreateWarehouseRequest request
    ) {
        WarehouseDto warehouse = warehouseService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(warehouse));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<WarehouseDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateWarehouseRequest request
    ) {
        WarehouseDto warehouse = warehouseService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(warehouse));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        warehouseService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/set-default")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<WarehouseDto>> setDefault(@PathVariable UUID id) {
        WarehouseDto warehouse = warehouseService.setDefault(id);
        return ResponseEntity.ok(ApiResponse.success(warehouse));
    }
}
