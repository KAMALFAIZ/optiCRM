package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.DashboardKpiDTO;
import com.opticrm.delivery.dto.RepDashboardDTO;
import com.opticrm.delivery.service.DeliveryDashboardService;
import com.opticrm.delivery.service.RepDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/dashboard")
@RequiredArgsConstructor
public class DeliveryDashboardController {

    private final DeliveryDashboardService dashboardService;
    private final RepDashboardService repDashboardService;

    /** Dashboard global gestionnaire */
    @GetMapping("/kpis")
    public ResponseEntity<DashboardKpiDTO> getKpis() {
        return ResponseEntity.ok(dashboardService.getKpis());
    }

    /**
     * GET /api/v1/delivery/dashboard/rep/{repId}?date=2026-04-24
     * Dashboard temps réel du vendeur sur le terrain.
     * Si date absent → aujourd'hui.
     */
    @GetMapping("/rep/{repId}")
    public ResponseEntity<RepDashboardDTO> getRepDashboard(
            @PathVariable UUID repId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(repDashboardService.getDashboard(repId, date));
    }
}
