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
public class SupervisionDto {

    private List<RepScoreDto> scores;
    private List<SupervisionAlertDto> alerts;
    private double teamAverageScore;
    private TeamBenchmarkDto teamBenchmark;
    private List<RepBenchmarkDto> repBenchmarks;
}
