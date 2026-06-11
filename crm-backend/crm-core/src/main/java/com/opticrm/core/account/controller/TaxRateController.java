package com.opticrm.core.account.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.core.account.entity.TaxRate;
import com.opticrm.core.account.repository.TaxRateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tax-rates")
@RequiredArgsConstructor
public class TaxRateController {

    private final TaxRateRepository taxRateRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<TaxRate>>> list() {
        List<TaxRate> taxRates = taxRateRepository.findAllOrdered();
        return ResponseEntity.ok(ApiResponse.success(taxRates));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<TaxRate>>> listActive() {
        List<TaxRate> taxRates = taxRateRepository.findByIsActiveTrue();
        return ResponseEntity.ok(ApiResponse.success(taxRates));
    }
}
