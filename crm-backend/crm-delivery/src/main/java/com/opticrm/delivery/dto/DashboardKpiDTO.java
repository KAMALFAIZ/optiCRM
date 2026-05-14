package com.opticrm.delivery.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardKpiDTO {

    // ── Tournées ──────────────────────────────────────────────────────────────
    private long toursDraft;
    private long toursValide;
    private long toursClosed;
    private long toursToday;

    // ── CA ────────────────────────────────────────────────────────────────────
    private BigDecimal revenueToday;
    private BigDecimal revenueMonth;
    private BigDecimal collectedToday;
    private BigDecimal collectedMonth;

    // ── Crédit en cours ───────────────────────────────────────────────────────
    private BigDecimal totalOutstandingCredit;

    // ── Taux encaissement (%) ─────────────────────────────────────────────────
    private int collectionRateToday;
    private int collectionRateMonth;

    // ── Évolution CA 30 derniers jours ────────────────────────────────────────
    private List<DayRevenue> dailyRevenue;

    // ── Top 5 représentants ───────────────────────────────────────────────────
    private List<RepRevenue> topReps;

    // ── Top 5 articles ────────────────────────────────────────────────────────
    private List<ItemRevenue> topItems;

    // ── Répartition résultats visite (mois en cours) ──────────────────────────
    private Map<String, Long> visitResultBreakdown;

    // ── Comparaison M-1 ───────────────────────────────────────────────────────
    private BigDecimal revenueMonthPrev;        // CA mois précédent
    private BigDecimal collectedMonthPrev;      // Encaissé mois précédent
    private Integer revenueGrowthPct;           // Δ% CA mois / mois-1
    private Integer collectionRateMonthPrev;    // Taux encaissement mois précédent

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DayRevenue {
        private String date;          // "2026-04-24"
        private BigDecimal revenue;
        private BigDecimal collected;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RepRevenue {
        private String representativeId;
        private BigDecimal revenue;
        private BigDecimal collected;
        private int tourCount;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ItemRevenue {
        private String itemId;
        private int quantity;
        private BigDecimal revenue;
    }
}
