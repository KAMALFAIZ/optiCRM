package com.opticrm.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyTrendDto {

    private String month; // "2026-01", "2026-02", etc.

    private BigDecimal revenue;
    private long dealsWon;
    private long dealsLost;
    private double winRate;
    private BigDecimal pipeline;
    private long newDeals;

    private long visits;
    private long completedVisits;
    private double visitCompletionRate;
}
