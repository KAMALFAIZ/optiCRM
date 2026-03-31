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
public class CommercialKpiDto {

    private UUID userId;
    private String userName;
    private String email;

    // Win/Loss
    private long wonCount;
    private long lostCount;
    private double winRate;

    // Revenue
    private BigDecimal totalRevenue;
    private BigDecimal averageDealSize;

    // Pipeline
    private BigDecimal pipelineValue;
    private long openDeals;
}
