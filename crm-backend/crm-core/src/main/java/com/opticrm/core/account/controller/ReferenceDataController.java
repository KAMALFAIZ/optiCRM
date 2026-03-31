package com.opticrm.core.account.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.core.account.dto.ReferenceDataDto;
import com.opticrm.core.account.service.ReferenceDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reference-data")
@RequiredArgsConstructor
public class ReferenceDataController {

    private final ReferenceDataService service;

    /** Retourne toutes les données de référence groupées par catégorie */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, List<ReferenceDataDto>>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    /** Retourne les données d'une catégorie (toutes, y compris inactives — pour l'admin) */
    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<ReferenceDataDto>>> getByCategory(
            @PathVariable String category
    ) {
        return ResponseEntity.ok(ApiResponse.success(service.getByCategory(category)));
    }

    /** Retourne uniquement les données actives d'une catégorie (pour les formulaires) */
    @GetMapping("/category/{category}/active")
    public ResponseEntity<ApiResponse<List<ReferenceDataDto>>> getActiveByCategory(
            @PathVariable String category
    ) {
        return ResponseEntity.ok(ApiResponse.success(service.getActiveByCategory(category)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<ReferenceDataDto>> create(
            @RequestBody ReferenceDataDto dto
    ) {
        return ResponseEntity.ok(ApiResponse.success(service.create(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<ReferenceDataDto>> update(
            @PathVariable UUID id,
            @RequestBody ReferenceDataDto dto
    ) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
