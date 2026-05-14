package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.CreditAgingDTO;
import com.opticrm.delivery.service.CreditAgingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/credit-aging")
@RequiredArgsConstructor
public class CreditAgingController {

    private final CreditAgingService creditAgingService;

    /**
     * GET /api/v1/delivery/credit-aging?customerId=...
     */
    @GetMapping
    public ResponseEntity<CreditAgingDTO> getAging(
            @RequestParam(required = false) UUID customerId) {
        return ResponseEntity.ok(creditAgingService.getAging(customerId));
    }
}
