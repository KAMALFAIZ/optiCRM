package com.opticrm.core.account.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.core.account.dto.CustomFieldDto;
import com.opticrm.core.account.dto.CustomFieldValueDto;
import com.opticrm.core.account.service.CustomFieldService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/custom-fields")
@RequiredArgsConstructor
public class CustomFieldController {

    private final CustomFieldService service;

    // ───── Field definitions (admin) ────────────────────────────────────────

    /** Toutes les définitions de champs (y compris inactifs) — pour l'admin */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CustomFieldDto>>> getAllFields() {
        return ResponseEntity.ok(ApiResponse.success(service.getAllFields()));
    }

    /** Champs actifs uniquement — pour les formulaires */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<CustomFieldDto>>> getActiveFields() {
        return ResponseEntity.ok(ApiResponse.success(service.getActiveFields()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<CustomFieldDto>> createField(
            @RequestBody CustomFieldDto dto
    ) {
        return ResponseEntity.ok(ApiResponse.success(service.createField(dto)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<CustomFieldDto>> updateField(
            @PathVariable UUID id,
            @RequestBody CustomFieldDto dto
    ) {
        return ResponseEntity.ok(ApiResponse.success(service.updateField(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteField(@PathVariable UUID id) {
        service.deleteField(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ───── Field values (per account) ───────────────────────────────────────

    /** Récupérer les valeurs des champs libres pour un compte */
    @GetMapping("/accounts/{accountId}/values")
    public ResponseEntity<ApiResponse<List<CustomFieldValueDto>>> getAccountValues(
            @PathVariable UUID accountId
    ) {
        return ResponseEntity.ok(ApiResponse.success(service.getValuesForAccount(accountId)));
    }

    /** Sauvegarder les valeurs des champs libres pour un compte */
    @PutMapping("/accounts/{accountId}/values")
    public ResponseEntity<ApiResponse<List<CustomFieldValueDto>>> saveAccountValues(
            @PathVariable UUID accountId,
            @RequestBody Map<UUID, String> fieldValues
    ) {
        return ResponseEntity.ok(ApiResponse.success(service.saveValuesForAccount(accountId, fieldValues)));
    }
}
