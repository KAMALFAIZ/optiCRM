package com.opticrm.core.account.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.core.account.dto.CreatePricingCategoryRequest;
import com.opticrm.core.account.dto.PricingCategoryDto;
import com.opticrm.core.account.service.PricingCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/pricing-categories")
@RequiredArgsConstructor
public class PricingCategoryController {

    private final PricingCategoryService pricingCategoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<List<PricingCategoryDto>>> list() {
        return ResponseEntity.ok(ApiResponse.success(pricingCategoryService.getAll()));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<List<PricingCategoryDto>>> listActive() {
        return ResponseEntity.ok(ApiResponse.success(pricingCategoryService.getActive()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<PricingCategoryDto>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(pricingCategoryService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<PricingCategoryDto>> create(
            @Valid @RequestBody CreatePricingCategoryRequest request) {
        PricingCategoryDto dto = pricingCategoryService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<PricingCategoryDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreatePricingCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(pricingCategoryService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        pricingCategoryService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
