package com.opticrm.reporting.service;

import com.opticrm.reporting.dto.*;
import com.opticrm.reporting.dto.SupervisionAlertDto.Severity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupervisionService {

    private final KpiService kpiService;

    // Weights (total = 100)
    private static final int W_REVENUE = 30;
    private static final int W_WIN_RATE = 20;
    private static final int W_VISIT_COMPLETION = 20;
    private static final int W_VISIT_FREQ = 15;
    private static final int W_PIPELINE = 15;

    // Alert thresholds
    private static final double ALERT_WIN_RATE_CRITICAL = 15.0;
    private static final double ALERT_WIN_RATE_WARNING = 30.0;
    private static final long ALERT_NO_VISITS = 0;
    private static final long ALERT_LOW_VISITS = 3;
    private static final double ALERT_VISIT_COMPLETION_LOW = 40.0;
    private static final long ALERT_EMPTY_PIPELINE = 0;

    public SupervisionDto buildSupervision() {
        return buildSupervision(null);
    }

    /**
     * @param userFilter null = all users; non-null = only these user IDs
     */
    public SupervisionDto buildSupervision(Set<UUID> userFilter) {
        List<CommercialKpiDto> kpis = kpiService.getCommercialKpis(userFilter);

        if (kpis.isEmpty()) {
            return SupervisionDto.builder()
                    .scores(List.of())
                    .alerts(List.of())
                    .teamAverageScore(0)
                    .build();
        }

        // Find max values for normalization
        BigDecimal maxRevenue = kpis.stream()
                .map(CommercialKpiDto::getTotalRevenue)
                .max(Comparator.naturalOrder())
                .orElse(BigDecimal.ONE);
        if (maxRevenue.compareTo(BigDecimal.ZERO) == 0) maxRevenue = BigDecimal.ONE;

        BigDecimal maxPipeline = kpis.stream()
                .map(CommercialKpiDto::getPipelineValue)
                .max(Comparator.naturalOrder())
                .orElse(BigDecimal.ONE);
        if (maxPipeline.compareTo(BigDecimal.ZERO) == 0) maxPipeline = BigDecimal.ONE;

        long maxVisits = kpis.stream()
                .mapToLong(CommercialKpiDto::getTotalVisits)
                .max()
                .orElse(1);
        if (maxVisits == 0) maxVisits = 1;

        List<RepScoreDto> scores = new ArrayList<>();
        List<SupervisionAlertDto> alerts = new ArrayList<>();

        for (CommercialKpiDto kpi : kpis) {
            int revenueScore = normalize(kpi.getTotalRevenue(), maxRevenue);
            int winRateScore = Math.min(100, (int) Math.round(kpi.getWinRate()));
            int visitCompletionScore = Math.min(100, (int) Math.round(kpi.getVisitCompletionRate()));
            int visitFreqScore = (int) Math.round((double) kpi.getTotalVisits() / maxVisits * 100);
            int pipelineScore = normalize(kpi.getPipelineValue(), maxPipeline);

            int composite = (revenueScore * W_REVENUE
                    + winRateScore * W_WIN_RATE
                    + visitCompletionScore * W_VISIT_COMPLETION
                    + visitFreqScore * W_VISIT_FREQ
                    + pipelineScore * W_PIPELINE) / 100;

            scores.add(RepScoreDto.builder()
                    .userId(kpi.getUserId())
                    .repName(kpi.getUserName())
                    .score(composite)
                    .revenueScore(revenueScore)
                    .winRateScore(winRateScore)
                    .visitCompletionScore(visitCompletionScore)
                    .visitFrequencyScore(visitFreqScore)
                    .pipelineScore(pipelineScore)
                    .revenue(kpi.getTotalRevenue())
                    .winRate(kpi.getWinRate())
                    .visitCompletionRate(kpi.getVisitCompletionRate())
                    .totalVisits(kpi.getTotalVisits())
                    .pipelineValue(kpi.getPipelineValue())
                    .build());

            // Generate alerts
            if (kpi.getWinRate() <= ALERT_WIN_RATE_CRITICAL && (kpi.getWonCount() + kpi.getLostCount()) > 0) {
                alerts.add(alert(kpi, Severity.CRITICAL, "LOW_WIN_RATE",
                        "Win rate critique (" + String.format("%.1f", kpi.getWinRate()) + "%) — accompagnement nécessaire",
                        kpi.getWinRate(), ALERT_WIN_RATE_CRITICAL));
            } else if (kpi.getWinRate() <= ALERT_WIN_RATE_WARNING && (kpi.getWonCount() + kpi.getLostCount()) > 0) {
                alerts.add(alert(kpi, Severity.WARNING, "LOW_WIN_RATE",
                        "Win rate faible (" + String.format("%.1f", kpi.getWinRate()) + "%) — à surveiller",
                        kpi.getWinRate(), ALERT_WIN_RATE_WARNING));
            }

            if (kpi.getTotalVisits() == ALERT_NO_VISITS) {
                alerts.add(alert(kpi, Severity.CRITICAL, "NO_VISITS",
                        "Aucune visite terrain enregistrée",
                        0, 1));
            } else if (kpi.getTotalVisits() <= ALERT_LOW_VISITS) {
                alerts.add(alert(kpi, Severity.WARNING, "LOW_VISITS",
                        "Peu de visites terrain (" + kpi.getTotalVisits() + ")",
                        kpi.getTotalVisits(), ALERT_LOW_VISITS));
            }

            if (kpi.getVisitCompletionRate() < ALERT_VISIT_COMPLETION_LOW && kpi.getTotalVisits() > 0) {
                alerts.add(alert(kpi, Severity.WARNING, "LOW_VISIT_COMPLETION",
                        "Taux de complétion visites bas (" + String.format("%.1f", kpi.getVisitCompletionRate()) + "%)",
                        kpi.getVisitCompletionRate(), ALERT_VISIT_COMPLETION_LOW));
            }

            if (kpi.getOpenDeals() == ALERT_EMPTY_PIPELINE) {
                alerts.add(alert(kpi, Severity.WARNING, "EMPTY_PIPELINE",
                        "Pipeline vide — aucun deal ouvert",
                        0, 1));
            }
        }

        scores.sort(Comparator.comparingInt(RepScoreDto::getScore).reversed());

        // Critical first, then warning, then info
        alerts.sort(Comparator.comparingInt((SupervisionAlertDto a) -> a.getSeverity().ordinal()));

        double teamAvg = scores.stream().mapToInt(RepScoreDto::getScore).average().orElse(0);

        // -- Benchmarks --
        int n = kpis.size();
        BigDecimal avgRevenue = kpis.stream().map(CommercialKpiDto::getTotalRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);
        double avgWinRate = kpis.stream().mapToDouble(CommercialKpiDto::getWinRate).average().orElse(0);
        BigDecimal avgDealSize = kpis.stream().map(CommercialKpiDto::getAverageDealSize)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);
        BigDecimal avgPipeline = kpis.stream().map(CommercialKpiDto::getPipelineValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);
        double avgVisits = kpis.stream().mapToLong(CommercialKpiDto::getTotalVisits).average().orElse(0);
        double avgVisitCompletion = kpis.stream().mapToDouble(CommercialKpiDto::getVisitCompletionRate).average().orElse(0);
        BigDecimal avgMileage = kpis.stream().map(CommercialKpiDto::getTotalMileage)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);
        BigDecimal avgExpenses = kpis.stream().map(CommercialKpiDto::getTotalExpenses)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);

        TeamBenchmarkDto teamBenchmark = TeamBenchmarkDto.builder()
                .avgRevenue(avgRevenue)
                .avgWinRate(round2(avgWinRate))
                .avgDealSize(avgDealSize)
                .avgPipeline(avgPipeline)
                .avgVisits(round2(avgVisits))
                .avgVisitCompletionRate(round2(avgVisitCompletion))
                .avgMileage(avgMileage)
                .avgExpenses(avgExpenses)
                .totalReps(n)
                .build();

        List<RepBenchmarkDto> repBenchmarks = new ArrayList<>();
        for (CommercialKpiDto kpi : kpis) {
            repBenchmarks.add(RepBenchmarkDto.builder()
                    .userId(kpi.getUserId())
                    .repName(kpi.getUserName())
                    .revenue(kpi.getTotalRevenue())
                    .revenueDeviation(deviationPct(kpi.getTotalRevenue(), avgRevenue))
                    .winRate(kpi.getWinRate())
                    .winRateDeviation(round2(kpi.getWinRate() - avgWinRate))
                    .averageDealSize(kpi.getAverageDealSize())
                    .dealSizeDeviation(deviationPct(kpi.getAverageDealSize(), avgDealSize))
                    .pipelineValue(kpi.getPipelineValue())
                    .pipelineDeviation(deviationPct(kpi.getPipelineValue(), avgPipeline))
                    .totalVisits(kpi.getTotalVisits())
                    .visitsDeviation(avgVisits > 0 ? round2((kpi.getTotalVisits() - avgVisits) / avgVisits * 100) : 0)
                    .visitCompletionRate(kpi.getVisitCompletionRate())
                    .visitCompletionDeviation(round2(kpi.getVisitCompletionRate() - avgVisitCompletion))
                    .build());
        }
        repBenchmarks.sort(Comparator.comparingDouble(RepBenchmarkDto::getRevenueDeviation).reversed());

        return SupervisionDto.builder()
                .scores(scores)
                .alerts(alerts)
                .teamAverageScore(Math.round(teamAvg * 10.0) / 10.0)
                .teamBenchmark(teamBenchmark)
                .repBenchmarks(repBenchmarks)
                .build();
    }

    private int normalize(BigDecimal value, BigDecimal max) {
        if (max.compareTo(BigDecimal.ZERO) == 0) return 0;
        return Math.min(100, value.multiply(BigDecimal.valueOf(100))
                .divide(max, 0, java.math.RoundingMode.HALF_UP)
                .intValue());
    }

    private SupervisionAlertDto alert(CommercialKpiDto kpi, Severity severity, String code,
                                       String message, double value, double threshold) {
        return SupervisionAlertDto.builder()
                .userId(kpi.getUserId())
                .repName(kpi.getUserName())
                .severity(severity)
                .code(code)
                .message(message)
                .value(value)
                .threshold(threshold)
                .build();
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private double deviationPct(BigDecimal value, BigDecimal avg) {
        if (avg.compareTo(BigDecimal.ZERO) == 0) return 0;
        return round2(value.subtract(avg)
                .multiply(BigDecimal.valueOf(100))
                .divide(avg, 2, RoundingMode.HALF_UP)
                .doubleValue());
    }
}
