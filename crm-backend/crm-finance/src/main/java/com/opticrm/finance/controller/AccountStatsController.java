package com.opticrm.finance.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.finance.dto.AccountStatsDto;
import com.opticrm.finance.service.AccountStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Tag(name = "Account Stats", description = "Account statistics aggregation")
public class AccountStatsController {

    private final AccountStatsService accountStatsService;

    @GetMapping("/{id}/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    @Operation(summary = "Get account statistics", description = "Returns aggregated statistics for an account (contacts, opportunities, revenue, invoices)")
    public ResponseEntity<ApiResponse<AccountStatsDto>> getAccountStats(@PathVariable UUID id) {
        AccountStatsDto stats = accountStatsService.getAccountStats(id);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
