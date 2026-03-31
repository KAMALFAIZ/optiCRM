package com.opticrm.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {

    // Entity counts
    private long totalAccounts;
    private long totalContacts;
    private long totalLeads;
    private long totalOpportunities;

    // Pipeline
    private BigDecimal pipelineTotal;
    private BigDecimal pipelineWeighted;

    // Won deals
    private long wonThisMonth;
    private long wonThisYear;

    // Revenue
    private BigDecimal revenueThisMonth;
    private BigDecimal revenueThisYear;

    // Conversion
    private double conversionRate;

    // Leads breakdown
    private Map<String, Long> leadsBySource;

    // Revenue trend
    private List<MonthlyRevenue> revenueByMonth;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyRevenue {
        private String month;
        private BigDecimal amount;
    }
}
