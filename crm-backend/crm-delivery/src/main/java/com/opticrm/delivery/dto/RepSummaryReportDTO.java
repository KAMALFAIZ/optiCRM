package com.opticrm.delivery.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

/** Résumé agrégé par représentant pour une période donnée. */
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RepSummaryReportDTO {
    private UUID representativeId;
    private int tourCount;
    private int totalLines;
    private int deliveredCount;
    private int absentCount;
    private int refusedCount;
    private int closedCount;
    private BigDecimal totalRevenue;
    private BigDecimal collectedAmount;
    private BigDecimal creditOutstanding;
    private int collectionRate;      // %
    private int deliveryRate;        // livré / total %
    // Objectif mensuel (si disponible)
    private BigDecimal revenueTarget;
    private int revenueRateVsTarget; // %
}
