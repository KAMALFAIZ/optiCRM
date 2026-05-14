package com.opticrm.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendDataDto {

    private List<MonthlyTrendDto> teamTrend;
    private List<RepTrendDto> repTrends;
    private int monthsIncluded;
}
