package com.opticrm.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

public class ForecastDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForecastByMonth {
        private String month;
        private BigDecimal pipeline;
        private BigDecimal weighted;
        private BigDecimal won;
        private long opportunityCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForecastByRep {
        private UUID userId;
        private String repName;
        private BigDecimal pipeline;
        private BigDecimal weighted;
        private BigDecimal won;
        private long opportunityCount;
        private double winRate;
    }
}
