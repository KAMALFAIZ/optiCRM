package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.AbcClientReportDTO;
import com.opticrm.delivery.dto.ComparativeReportDTO;
import com.opticrm.delivery.dto.RepSummaryReportDTO;
import com.opticrm.delivery.dto.TourReportDTO;
import com.opticrm.delivery.service.DeliveryReportService;
import com.opticrm.delivery.service.ManagerReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/report")
@RequiredArgsConstructor
public class DeliveryReportController {

    private final DeliveryReportService reportService;
    private final ManagerReportService managerReportService;

    /**
     * GET /api/v1/delivery/report/tours?from=2026-04-01&to=2026-04-30&representativeId=...
     * Rapport détaillé tournée par tournée.
     */
    @GetMapping("/tours")
    public ResponseEntity<List<TourReportDTO>> getTourReports(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) UUID representativeId) {
        return ResponseEntity.ok(reportService.getTourReports(from, to, representativeId));
    }

    /**
     * GET /api/v1/delivery/report/reps?from=2026-04-01&to=2026-04-30
     * Résumé agrégé par représentant : CA, taux encaissement, créances, objectif.
     */
    @GetMapping("/reps")
    public ResponseEntity<List<RepSummaryReportDTO>> getRepSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(managerReportService.getRepSummaryReport(from, to));
    }

    /**
     * GET /api/v1/delivery/report/abc-clients?from=2026-04-01&to=2026-04-30&repId=...
     * Analyse ABC clients par CA — segments A (80%), B (15%), C (5%).
     * repId optionnel pour filtrer par représentant.
     */
    @GetMapping("/abc-clients")
    public ResponseEntity<AbcClientReportDTO> getAbcClients(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) UUID repId) {
        return ResponseEntity.ok(managerReportService.getAbcClientReport(from, to, repId));
    }

    /**
     * GET /api/v1/delivery/report/comparative?from=2026-04-01&to=2026-04-30
     * Comparatif N vs N-1 (même période, un an en arrière) — global et par représentant.
     */
    @GetMapping("/comparative")
    public ResponseEntity<ComparativeReportDTO> getComparative(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(managerReportService.getComparativeReport(from, to));
    }
}
