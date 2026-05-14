package com.opticrm.delivery.service;

import com.opticrm.delivery.entity.DeliveryLine;
import com.opticrm.delivery.entity.DeliveryTour;
import com.opticrm.delivery.entity.SettlementReport;
import com.opticrm.delivery.entity.VehicleLoad;
import com.opticrm.delivery.entity.VehicleLoadItem;
import com.opticrm.delivery.entity.VehicleUnload;
import com.opticrm.delivery.repository.DeliveryTourRepository;
import com.opticrm.delivery.repository.SettlementReportRepository;
import com.opticrm.delivery.repository.VehicleLoadRepository;
import com.opticrm.delivery.repository.VehicleUnloadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class SettlementService {

    /** Seuil d'écart caisse (en devises) déclenchant une demande d'approbation */
    private static final java.math.BigDecimal DISCREPANCY_THRESHOLD = new java.math.BigDecimal("500");
    /** Seuil d'écart stock (unités) déclenchant une demande d'approbation */
    private static final int STOCK_DISCREPANCY_THRESHOLD = 5;

    private final SettlementReportRepository settlementReportRepository;
    private final DeliveryTourRepository deliveryTourRepository;
    private final VehicleLoadRepository vehicleLoadRepository;
    private final VehicleUnloadRepository vehicleUnloadRepository;
    private final AuditTrailService auditTrailService;

    // ── Génération ────────────────────────────────────────────────────────────

    public SettlementReport generateReport(UUID tourId) {
        log.info("Generating settlement report for tour: {}", tourId);

        DeliveryTour tour = deliveryTourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));

        BigDecimal totalAmount    = BigDecimal.ZERO;
        BigDecimal cashAmount     = BigDecimal.ZERO;
        BigDecimal chequeAmount   = BigDecimal.ZERO;
        BigDecimal traiteAmount   = BigDecimal.ZERO;
        BigDecimal virementAmount = BigDecimal.ZERO;
        BigDecimal creditAmount   = BigDecimal.ZERO;
        BigDecimal collectedAmount = BigDecimal.ZERO;

        List<DeliveryLine> lines = tour.getDeliveryLines() != null ? tour.getDeliveryLines() : List.of();
        for (DeliveryLine line : lines) {
            if (line.getVisitResult() != DeliveryLine.VisitResult.DELIVERED
                    && line.getVisitResult() != DeliveryLine.VisitResult.PARTIAL) {
                continue;
            }
            BigDecimal amount = nvl(line.getAmount());
            BigDecimal paid   = nvl(line.getPaidAmount());
            totalAmount = totalAmount.add(amount);

            DeliveryLine.PaymentMode pm = line.getPaymentMode();
            if (pm == null) pm = DeliveryLine.PaymentMode.CASH;

            switch (pm) {
                case CASH     -> { cashAmount     = cashAmount.add(paid);     collectedAmount = collectedAmount.add(paid); }
                case CHEQUE   -> { chequeAmount   = chequeAmount.add(paid);   collectedAmount = collectedAmount.add(paid); }
                case TRAITE   -> { traiteAmount   = traiteAmount.add(paid);   collectedAmount = collectedAmount.add(paid); }
                case VIREMENT -> { virementAmount = virementAmount.add(paid); collectedAmount = collectedAmount.add(paid); }
                case CREDIT   -> { creditAmount   = creditAmount.add(amount); collectedAmount = collectedAmount.add(paid); }
            }
        }

        BigDecimal creditBalance = creditAmount.subtract(
            collectedAmount.subtract(cashAmount).subtract(chequeAmount)
                          .subtract(traiteAmount).subtract(virementAmount)
        );
        if (creditBalance.compareTo(BigDecimal.ZERO) < 0) creditBalance = BigDecimal.ZERO;

        // ── Rapprochement stock ───────────────────────────────────────────────
        int stockTheoretical = computeTheoreticalRemainder(tourId, lines);
        int stockPhysical    = computePhysicalCount(tourId);
        int stockDisc        = stockPhysical - stockTheoretical;

        SettlementReport report = SettlementReport.builder()
                .deliveryTourId(tourId)
                .totalAmount(totalAmount)
                .collectedAmount(collectedAmount)
                .cashAmount(cashAmount)
                .chequeAmount(chequeAmount)
                .traiteAmount(traiteAmount)
                .virementAmount(virementAmount)
                .creditAmount(creditAmount)
                .creditBalance(creditBalance)
                .unloadedValue(BigDecimal.ZERO)
                .discrepancy(BigDecimal.ZERO)
                .stockTheoretical(stockTheoretical)
                .stockPhysical(stockPhysical)
                .stockDiscrepancy(stockDisc)
                .generatedAt(LocalDateTime.now())
                .status(SettlementReport.SettlementStatus.DRAFT)
                .build();

        SettlementReport saved = settlementReportRepository.save(report);
        auditTrailService.logAction("GENERATE_SETTLEMENT", "SettlementReport", saved.getId(), null,
            "Total=" + totalAmount + " | Cash=" + cashAmount + " | Chèque=" + chequeAmount +
            " | Traite=" + traiteAmount + " | Virement=" + virementAmount +
            " | Crédit=" + creditAmount + " | Stock écart=" + stockDisc);
        return saved;
    }

    // ── Saisie écart caisse ───────────────────────────────────────────────────

    public SettlementReport updateDiscrepancy(UUID reportId, BigDecimal discrepancy, String notes) {
        SettlementReport report = settlementReportRepository.findById(reportId)
            .orElseThrow(() -> new RuntimeException("Settlement report not found"));
        if (report.getStatus() == SettlementReport.SettlementStatus.FINALIZED) {
            throw new IllegalStateException("Rapport déjà finalisé — modification interdite.");
        }
        report.setDiscrepancy(discrepancy != null ? discrepancy : BigDecimal.ZERO);
        if (notes != null) report.setNotes(notes);
        return settlementReportRepository.save(report);
    }

    public SettlementReport updateStockPhysical(UUID reportId, int stockPhysical) {
        SettlementReport report = settlementReportRepository.findById(reportId)
            .orElseThrow(() -> new RuntimeException("Settlement report not found"));
        if (report.getStatus() == SettlementReport.SettlementStatus.FINALIZED) {
            throw new IllegalStateException("Rapport déjà finalisé — modification interdite.");
        }
        report.setStockPhysical(stockPhysical);
        report.setStockDiscrepancy(stockPhysical - (report.getStockTheoretical() != null ? report.getStockTheoretical() : 0));
        return settlementReportRepository.save(report);
    }

    // ── Finalisation ──────────────────────────────────────────────────────────

    /**
     * Finalise le rapport de règlement.
     * Si un écart dépasse le seuil, passe en PENDING_APPROVAL au lieu de FINALIZED.
     */
    public SettlementReport finalize(UUID reportId, UUID finalizedBy) {
        SettlementReport report = settlementReportRepository.findById(reportId)
            .orElseThrow(() -> new RuntimeException("Settlement report not found"));
        if (report.getStatus() == SettlementReport.SettlementStatus.FINALIZED) {
            throw new IllegalStateException("Rapport déjà finalisé.");
        }

        boolean ecartCaisseExcede = report.getDiscrepancy() != null &&
            report.getDiscrepancy().abs().compareTo(DISCREPANCY_THRESHOLD) > 0;
        boolean ecartStockExcede = report.getStockDiscrepancy() != null &&
            Math.abs(report.getStockDiscrepancy()) > STOCK_DISCREPANCY_THRESHOLD;

        if (ecartCaisseExcede || ecartStockExcede) {
            // Escalade vers le superviseur
            report.setStatus(SettlementReport.SettlementStatus.PENDING_APPROVAL);
            report.setFinalizedBy(finalizedBy);
            report.setFinalizedAt(LocalDateTime.now());
            SettlementReport saved = settlementReportRepository.save(report);
            auditTrailService.logAction("SETTLEMENT_PENDING_APPROVAL", "SettlementReport", saved.getId(), null,
                "Écart supérieur au seuil — approbation superviseur requise. " +
                "Caisse=" + report.getDiscrepancy() + " / Stock=" + report.getStockDiscrepancy());
            return saved;
        }

        report.setStatus(SettlementReport.SettlementStatus.FINALIZED);
        report.setFinalizedAt(LocalDateTime.now());
        report.setFinalizedBy(finalizedBy);
        SettlementReport saved = settlementReportRepository.save(report);
        auditTrailService.logAction("FINALIZE_SETTLEMENT", "SettlementReport", saved.getId(), null,
            "Finalisé par " + finalizedBy);
        return saved;
    }

    /**
     * Approuve un rapport en PENDING_APPROVAL (rôle superviseur).
     * Le rapport passe ensuite en FINALIZED.
     */
    public SettlementReport approve(UUID reportId, UUID approvedBy, String approvalNotes) {
        SettlementReport report = settlementReportRepository.findById(reportId)
            .orElseThrow(() -> new RuntimeException("Settlement report not found"));
        if (report.getStatus() != SettlementReport.SettlementStatus.PENDING_APPROVAL) {
            throw new IllegalStateException(
                "Seul un rapport en PENDING_APPROVAL peut être approuvé. Statut actuel : " + report.getStatus());
        }
        report.setStatus(SettlementReport.SettlementStatus.FINALIZED);
        report.setApprovedBy(approvedBy);
        report.setApprovedAt(LocalDateTime.now());
        report.setApprovalNotes(approvalNotes);
        SettlementReport saved = settlementReportRepository.save(report);
        auditTrailService.logAction("APPROVE_SETTLEMENT", "SettlementReport", saved.getId(), null,
            "Approuvé par " + approvedBy + (approvalNotes != null ? " : " + approvalNotes : ""));
        return saved;
    }

    // ── Lecture ───────────────────────────────────────────────────────────────

    public SettlementReport getReport(UUID tourId) {
        return settlementReportRepository.findByDeliveryTourId(tourId)
                .orElseThrow(() -> new RuntimeException("Settlement report not found"));
    }

    public SettlementReport getReportById(UUID reportId) {
        return settlementReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Settlement report not found"));
    }

    // ── Calculs stock ─────────────────────────────────────────────────────────

    private int computeTheoreticalRemainder(UUID tourId, List<DeliveryLine> lines) {
        List<VehicleLoad> loads = vehicleLoadRepository.findByDeliveryTourId(tourId);
        int totalLoaded = loads.stream()
            .filter(l -> l.getStatus() == VehicleLoad.LoadStatus.LOADED)
            .flatMapToInt(l -> l.getItems().stream().mapToInt(VehicleLoadItem::getQuantity))
            .sum();

        int totalDelivered = lines.stream()
            .filter(l -> l.getVisitResult() == DeliveryLine.VisitResult.DELIVERED
                      || l.getVisitResult() == DeliveryLine.VisitResult.PARTIAL)
            .mapToInt(l -> l.getQuantity() != null ? l.getQuantity() : 0)
            .sum();

        return Math.max(0, totalLoaded - totalDelivered);
    }

    private int computePhysicalCount(UUID tourId) {
        return vehicleUnloadRepository.findByDeliveryTourId(tourId)
            .map(u -> u.getItems() != null
                ? u.getItems().stream().mapToInt(i -> i.getQuantityUnloaded() != null ? i.getQuantityUnloaded() : 0).sum()
                : 0)
            .orElse(0);
    }

    private static BigDecimal nvl(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    public BigDecimal calculateBalance(BigDecimal totalAmount, BigDecimal collectedAmount) {
        return totalAmount.subtract(collectedAmount);
    }
}
