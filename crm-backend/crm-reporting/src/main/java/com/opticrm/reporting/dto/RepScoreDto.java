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
public class RepScoreDto {

    private UUID userId;
    private String repName;

    private int score;

    private int revenueScore;
    private int winRateScore;
    private int visitCompletionScore;
    private int visitFrequencyScore;
    private int pipelineScore;

    private BigDecimal revenue;
    private double winRate;
    private double visitCompletionRate;
    private long totalVisits;
    private BigDecimal pipelineValue;
}
