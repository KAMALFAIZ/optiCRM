package com.opticrm.delivery.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementReportDTO {
    private UUID id;
    private UUID deliveryTourId;

    // Montants facturés
    private BigDecimal totalAmount;

    // Encaissements par mode
    private BigDecimal collectedAmount;
    private BigDecimal cashAmount;
    private BigDecimal chequeAmount;
    private BigDecimal traiteAmount;
    private BigDecimal virementAmount;

    // Crédit
    private BigDecimal creditAmount;
    private BigDecimal creditBalance;

    // Stock
    private BigDecimal unloadedValue;
    private BigDecimal discrepancy;

    // Rapprochement stock
    private Integer stockTheoretical;
    private Integer stockPhysical;
    private Integer stockDiscrepancy;

    // Méta
    private String notes;
    private LocalDateTime generatedAt;
    private LocalDateTime finalizedAt;
    private UUID finalizedBy;
    private String status;

    // Approbation superviseur
    private UUID approvedBy;
    private LocalDateTime approvedAt;
    private String approvalNotes;
}
