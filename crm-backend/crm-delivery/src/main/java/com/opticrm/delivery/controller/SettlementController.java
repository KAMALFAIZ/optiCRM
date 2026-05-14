package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.SettlementReportDTO;
import com.opticrm.delivery.entity.SettlementReport;
import com.opticrm.delivery.service.SettlementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/settlement")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;

    @PostMapping("/tour/{tourId}")
    public ResponseEntity<SettlementReportDTO> generateReport(@PathVariable UUID tourId) {
        return ResponseEntity.ok(mapToDto(settlementService.generateReport(tourId)));
    }

    @GetMapping("/tour/{tourId}")
    public ResponseEntity<SettlementReportDTO> getReport(@PathVariable UUID tourId) {
        return ResponseEntity.ok(mapToDto(settlementService.getReport(tourId)));
    }

    @GetMapping("/{reportId}")
    public ResponseEntity<SettlementReportDTO> getReportById(@PathVariable UUID reportId) {
        return ResponseEntity.ok(mapToDto(settlementService.getReportById(reportId)));
    }

    /** Saisir l'écart caisse et une note */
    @PutMapping("/{reportId}/discrepancy")
    public ResponseEntity<SettlementReportDTO> updateDiscrepancy(
            @PathVariable UUID reportId,
            @RequestBody Map<String, Object> body) {
        BigDecimal discrepancy = body.containsKey("discrepancy")
            ? new BigDecimal(body.get("discrepancy").toString()) : BigDecimal.ZERO;
        String notes = body.containsKey("notes") ? body.get("notes").toString() : null;
        return ResponseEntity.ok(mapToDto(settlementService.updateDiscrepancy(reportId, discrepancy, notes)));
    }

    /** Saisir le décompte physique du stock retourné */
    @PutMapping("/{reportId}/stock-physical")
    public ResponseEntity<SettlementReportDTO> updateStockPhysical(
            @PathVariable UUID reportId,
            @RequestBody Map<String, Object> body) {
        int qty = ((Number) body.get("stockPhysical")).intValue();
        return ResponseEntity.ok(mapToDto(settlementService.updateStockPhysical(reportId, qty)));
    }

    /** Finaliser le rapport — verrouille les données (peut passer en PENDING_APPROVAL si écart > seuil) */
    @PutMapping("/{reportId}/finalize")
    public ResponseEntity<SettlementReportDTO> finalize(
            @PathVariable UUID reportId,
            @RequestParam(required = false) UUID finalizedBy) {
        return ResponseEntity.ok(mapToDto(settlementService.finalize(reportId, finalizedBy)));
    }

    /** Approuver un rapport en PENDING_APPROVAL (superviseur uniquement) */
    @PutMapping("/{reportId}/approve")
    public ResponseEntity<SettlementReportDTO> approve(
            @PathVariable UUID reportId,
            @RequestParam UUID approvedBy,
            @RequestBody(required = false) Map<String, Object> body) {
        String approvalNotes = (body != null && body.containsKey("approvalNotes"))
            ? body.get("approvalNotes").toString() : null;
        return ResponseEntity.ok(mapToDto(settlementService.approve(reportId, approvedBy, approvalNotes)));
    }

    private SettlementReportDTO mapToDto(SettlementReport r) {
        return SettlementReportDTO.builder()
                .id(r.getId())
                .deliveryTourId(r.getDeliveryTourId())
                .totalAmount(r.getTotalAmount())
                .collectedAmount(r.getCollectedAmount())
                .cashAmount(r.getCashAmount())
                .chequeAmount(r.getChequeAmount())
                .traiteAmount(r.getTraiteAmount())
                .virementAmount(r.getVirementAmount())
                .creditAmount(r.getCreditAmount())
                .creditBalance(r.getCreditBalance())
                .unloadedValue(r.getUnloadedValue())
                .discrepancy(r.getDiscrepancy())
                .stockTheoretical(r.getStockTheoretical())
                .stockPhysical(r.getStockPhysical())
                .stockDiscrepancy(r.getStockDiscrepancy())
                .notes(r.getNotes())
                .generatedAt(r.getGeneratedAt())
                .finalizedAt(r.getFinalizedAt())
                .finalizedBy(r.getFinalizedBy())
                .status(r.getStatus() != null ? r.getStatus().toString() : null)
                .approvedBy(r.getApprovedBy())
                .approvedAt(r.getApprovedAt())
                .approvalNotes(r.getApprovalNotes())
                .build();
    }
}
