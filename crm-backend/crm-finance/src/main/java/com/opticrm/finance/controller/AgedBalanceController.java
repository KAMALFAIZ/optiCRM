package com.opticrm.finance.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.finance.dto.AgedBalanceDto;
import com.opticrm.finance.service.AgedBalanceService;
import com.opticrm.security.config.ContextUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance")
@RequiredArgsConstructor
@Tag(name = "Finance", description = "API finance — rapports et analyses")
public class AgedBalanceController {

    private final AgedBalanceService agedBalanceService;

    /**
     * Retourne la balance âgée des créances clients.
     * - COMMERCIAL : voit uniquement ses propres comptes (filtrage automatique par userId)
     * - ADMIN / MANAGER / SUPER_ADMIN : filtre optionnel par commercialId
     *
     * GET /api/v1/finance/aged-balance
     * GET /api/v1/finance/aged-balance?commercialId=<uuid>
     */
    @GetMapping("/aged-balance")
    @Operation(
            summary = "Balance âgée des créances",
            description = "Agrège les factures ouvertes par client et par tranche d'ancienneté. " +
                          "Les commerciaux ne voient que leurs propres comptes."
    )
    public ResponseEntity<ApiResponse<List<AgedBalanceDto>>> getAgedBalance(
            @RequestParam(required = false) String commercialId) {

        String effectiveCommercialId;

        if (ContextUtils.hasRole("COMMERCIAL")) {
            // Un commercial ne voit que ses propres créances
            UUID currentUserId = ContextUtils.getCurrentUserId().orElse(null);
            effectiveCommercialId = currentUserId != null ? currentUserId.toString() : null;
        } else {
            // Admin / Manager / Super-admin : filtre libre
            effectiveCommercialId = (commercialId != null && !commercialId.isBlank())
                    ? commercialId
                    : null;
        }

        List<AgedBalanceDto> rows = agedBalanceService.getAgedBalance(effectiveCommercialId);
        return ResponseEntity.ok(ApiResponse.success(rows));
    }
}
