package com.opticrm.core.vente.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageResponse;
import com.opticrm.core.vente.dto.CreateVenteSaisieRequest;
import com.opticrm.core.vente.dto.UpdateVenteSaisieRequest;
import com.opticrm.core.vente.dto.VenteSaisieDto;
import com.opticrm.core.vente.service.VenteSaisieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ventes-saisies")
@RequiredArgsConstructor
public class VenteSaisieController {

    private final VenteSaisieService venteSaisieService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL','READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<PageResponse<VenteSaisieDto>>> findAll(
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String statut,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("dateVente").descending());
        Page<VenteSaisieDto> result = venteSaisieService.findAll(accountId, dateFrom, dateTo, statut, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL','READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<VenteSaisieDto>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(venteSaisieService.findById(id)));
    }

    @GetMapping("/account/{accountId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL','READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<VenteSaisieDto>>> findByAccount(@PathVariable UUID accountId) {
        return ResponseEntity.ok(ApiResponse.success(venteSaisieService.findByAccount(accountId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<VenteSaisieDto>> create(
            @Valid @RequestBody CreateVenteSaisieRequest request) {
        VenteSaisieDto dto = venteSaisieService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<VenteSaisieDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVenteSaisieRequest request) {
        return ResponseEntity.ok(ApiResponse.success(venteSaisieService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        venteSaisieService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
