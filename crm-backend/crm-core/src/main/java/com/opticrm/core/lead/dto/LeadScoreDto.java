package com.opticrm.core.lead.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Score de qualification d'un lead (0-100).
 *
 * Formule :
 *   Profil         → 0-35 pts  (coordonnées + entreprise)
 *   Qualification  → 0-40 pts  (budget, délai, produits, secteur)
 *   Engagement     → 0-25 pts  (statut + température)
 *   ──────────────────────────
 *   TOTAL          → 0-100 pts
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadScoreDto {

    private int score;   // 0-100
    private String label;  // "Très qualifié", "Qualifié", "En cours", "Peu qualifié", "Non qualifié"
    private String color;  // hex

    private Breakdown breakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Breakdown {
        // Composantes
        private int profile;       // 0-35
        private int qualification; // 0-40
        private int engagement;    // 0-25

        // Signaux profil
        private boolean hasEmail;
        private boolean hasPhone;
        private boolean hasCompany;
        private boolean hasJobTitle;
        private boolean hasCity;
        private boolean hasWebOrLinkedin;

        // Signaux qualification
        private boolean hasBudgetRange;
        private boolean hasDecisionTimeframe;
        private boolean hasInterestedProducts;
        private boolean hasIndustry;
        private boolean hasNumEmployees;

        // Signaux engagement
        private String status;
        private String rating;
        private boolean hasMeetingScheduled;
        private boolean hasDemoRequested;
    }
}
