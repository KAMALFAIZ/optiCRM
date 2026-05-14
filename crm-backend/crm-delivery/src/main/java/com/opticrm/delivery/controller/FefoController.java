package com.opticrm.delivery.controller;

import com.opticrm.delivery.service.FefoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/fefo")
@RequiredArgsConstructor
public class FefoController {

    private final FefoService fefoService;

    /**
     * GET /api/v1/delivery/fefo/suggest?itemId=&warehouseId=&qty=10
     * Retourne les lots à prélever en ordre FEFO (premier expirant, premier sorti).
     * L'app mobile l'appelle avant de charger le véhicule.
     */
    @GetMapping("/suggest")
    public ResponseEntity<List<FefoService.PickSuggestion>> suggest(
            @RequestParam UUID itemId,
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(defaultValue = "1") int qty) {
        return ResponseEntity.ok(fefoService.suggestPicks(itemId, warehouseId, qty));
    }
}
