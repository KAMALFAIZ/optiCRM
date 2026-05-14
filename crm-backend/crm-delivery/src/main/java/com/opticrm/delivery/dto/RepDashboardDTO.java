package com.opticrm.delivery.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Dashboard temps réel pour un vendeur (représentant) sur une journée donnée.
 * Consommé par l'application mobile pendant la tournée.
 */
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RepDashboardDTO {

    private UUID representativeId;
    private LocalDate date;

    // ── Tournée du jour ────────────────────────────────────────────────────
    private UUID tourId;
    private String tourStatus;
    private int totalClients;        // Clients prévus sur la tournée
    private int visitedClients;      // Clients déjà visités (toutes issues)
    private int deliveredClients;    // Livrés avec succès
    private int pendingClients;      // Restant à visiter

    // ── CA du jour ────────────────────────────────────────────────────────
    private BigDecimal revenueToday;
    private BigDecimal collectedToday;
    private BigDecimal creditToday;
    private int collectionRateToday; // %

    // ── Objectif mensuel ──────────────────────────────────────────────────
    private BigDecimal revenueTarget;
    private BigDecimal revenueActualMonth;
    private int revenueRateMonth;    // % réalisé vs objectif
    private int visitTarget;
    private int visitActualMonth;
    private int visitRateMonth;      // %

    // ── Stock véhicule restant ────────────────────────────────────────────
    private int stockRemainingTotal; // Total articles restants (toutes références)
    private List<StockItem> stockRemaining;

    // ── Répartition résultats visite ──────────────────────────────────────
    private Map<String, Integer> visitBreakdown; // DELIVERED/ABSENT/REFUSED/CLOSED/PARTIAL

    // ── Top 5 articles du jour ────────────────────────────────────────────
    private List<ItemStat> topItemsToday;

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StockItem {
        private UUID itemId;
        private int quantityLoaded;
        private int quantitySold;
        private int quantityRemaining;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ItemStat {
        private UUID itemId;
        private int quantitySold;
        private BigDecimal revenue;
    }
}
