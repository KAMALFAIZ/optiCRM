package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.CreditCheckDTO;
import com.opticrm.delivery.service.CreditCheckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/credit-check")
@RequiredArgsConstructor
public class CreditCheckController {

    private final CreditCheckService creditCheckService;

    /**
     * GET /api/v1/delivery/credit-check/{customerId}?amount=1500.00
     *
     * Retourne l'état de crédit du client et si une nouvelle vente est autorisée.
     * L'app mobile l'appelle avant d'enregistrer une vente à crédit.
     */
    @GetMapping("/{customerId}")
    public ResponseEntity<CreditCheckDTO> check(
            @PathVariable UUID customerId,
            @RequestParam(required = false) BigDecimal amount) {
        return ResponseEntity.ok(creditCheckService.check(customerId, amount));
    }
}
