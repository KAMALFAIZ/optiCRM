package com.opticrm.core.account.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HealthScoreDto {

    /** Score global de 0 à 100 */
    private int score;

    /** Libellé : "Excellent", "Bon", "Moyen", "Faible", "Critique" */
    private String label;

    /** Couleur hex associée au score */
    private String color;

    /** Détail par composante */
    private Breakdown breakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Breakdown {

        // ── Sous-scores ──────────────────────────────────────────────────────
        /** Engagement pipeline (0-35) */
        private int engagement;

        /** Taux de conversion (0-30) */
        private int conversion;

        /** Revenu gagné (0-20) */
        private int revenue;

        /** Complétude du profil (0-15) */
        private int profile;

        // ── Signaux bruts ────────────────────────────────────────────────────
        private long openOpportunities;
        private long wonOpportunities;
        private long totalOpportunities;

        /** Taux de gain en % (0.0 – 100.0) */
        private double winRate;

        private BigDecimal wonRevenue;
        private BigDecimal openPipeline;

        // Signaux profil
        private boolean hasPhone;
        private boolean hasWebsite;
        private boolean hasBillingCity;
        private boolean hasIndustry;
        private boolean hasSegment;
    }
}
