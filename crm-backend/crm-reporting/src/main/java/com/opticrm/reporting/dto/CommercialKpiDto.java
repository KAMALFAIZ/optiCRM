package com.opticrm.reporting.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("repName")
    private String userName;

    private String email;

    // Win/Loss
    @JsonProperty("dealsWon")
    private long wonCount;

    @JsonProperty("dealsLost")
    private long lostCount;

    private double winRate;

    // Revenue
    @JsonProperty("revenue")
    private BigDecimal totalRevenue;

    private BigDecimal averageDealSize;

    // Pipeline
    @JsonProperty("pipeline")
    private BigDecimal pipelineValue;

    private long openDeals;

    // Terrain (visits)
    private long totalVisits;
    private long completedVisits;
    private long plannedVisits;
    private long inProgressVisits;
    private double visitCompletionRate;
    private BigDecimal totalMileage;
    private BigDecimal totalExpenses;
}
