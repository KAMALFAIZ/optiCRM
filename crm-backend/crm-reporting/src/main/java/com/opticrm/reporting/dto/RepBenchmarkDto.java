package com.opticrm.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepBenchmarkDto {

    private UUID userId;
    private String repName;

    private BigDecimal revenue;
    private double revenueDeviation;

    private double winRate;
    private double winRateDeviation;

    private BigDecimal averageDealSize;
    private double dealSizeDeviation;

    private BigDecimal pipelineValue;
    private double pipelineDeviation;

    private long totalVisits;
    private double visitsDeviation;

    private double visitCompletionRate;
    private double visitCompletionDeviation;
}
