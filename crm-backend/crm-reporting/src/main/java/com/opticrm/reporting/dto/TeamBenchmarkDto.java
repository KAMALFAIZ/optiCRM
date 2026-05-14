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
public class TeamBenchmarkDto {

    private BigDecimal avgRevenue;
    private double avgWinRate;
    private BigDecimal avgDealSize;
    private BigDecimal avgPipeline;
    private double avgVisits;
    private double avgVisitCompletionRate;
    private BigDecimal avgMileage;
    private BigDecimal avgExpenses;
    private long totalReps;
}
