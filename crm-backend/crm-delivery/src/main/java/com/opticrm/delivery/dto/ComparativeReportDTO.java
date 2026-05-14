package com.opticrm.delivery.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Comparatif N vs N-1 sur une période donnée. */
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ComparativeReportDTO {

    private LocalDate fromN;
    private LocalDate toN;
    private LocalDate fromN1;
    private LocalDate toN1;

    // Agrégats globaux
    private BigDecimal revenueN;
    private BigDecimal revenueN1;
    private BigDecimal revenueVariation;   // revenueN - revenueN1
    private int revenueVariationPct;       // %

    private BigDecimal collectedN;
    private BigDecimal collectedN1;
    private int collectedVariationPct;

    private int deliveredCountN;
    private int deliveredCountN1;
    private int deliveredVariationPct;

    // Détail par représentant
    private List<RepRow> repRows;

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RepRow {
        private java.util.UUID representativeId;
        private BigDecimal revenueN;
        private BigDecimal revenueN1;
        private int variationPct;
        private BigDecimal collectedN;
        private int collectionRateN;
        private int collectionRateN1;
    }
}
