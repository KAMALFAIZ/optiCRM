package com.opticrm.reporting.service;

import com.opticrm.core.opportunity.entity.Opportunity;
import com.opticrm.core.opportunity.repository.OpportunityRepository;
import com.opticrm.core.visit.entity.Visit;
import com.opticrm.core.visit.repository.VisitRepository;
import com.opticrm.reporting.dto.MonthlyTrendDto;
import com.opticrm.reporting.dto.RepTrendDto;
import com.opticrm.reporting.dto.TrendDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TrendService {

    private final OpportunityRepository opportunityRepository;
    private final VisitRepository visitRepository;

    private static final int MONTHS_BACK = 6;
    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final ZoneId ZONE = ZoneId.systemDefault();

    public TrendDataDto buildTrends() {
        return buildTrends(null);
    }

    /**
     * @param userFilter null = all users; non-null = only these user IDs
     */
    public TrendDataDto buildTrends(Set<UUID> userFilter) {
        List<Opportunity> allOpps = opportunityRepository.findAll().stream()
                .filter(o -> userFilter == null || (o.getAssignedTo() != null && userFilter.contains(o.getAssignedTo().getId())))
                .collect(Collectors.toList());
        List<Visit> allVisits = visitRepository.findAll().stream()
                .filter(v -> userFilter == null || (v.getAssignedTo() != null && userFilter.contains(v.getAssignedTo().getId())))
                .collect(Collectors.toList());

        YearMonth now = YearMonth.now();
        List<String> monthLabels = new ArrayList<>();
        for (int i = MONTHS_BACK - 1; i >= 0; i--) {
            monthLabels.add(now.minusMonths(i).format(MONTH_FMT));
        }

        // --- Team trend ---
        List<MonthlyTrendDto> teamTrend = buildMonthlyTrend(allOpps, allVisits, monthLabels);

        // --- Per-rep trends ---
        Map<UUID, List<Opportunity>> oppsByUser = allOpps.stream()
                .filter(o -> o.getAssignedTo() != null)
                .collect(Collectors.groupingBy(o -> o.getAssignedTo().getId()));

        Map<UUID, List<Visit>> visitsByUser = allVisits.stream()
                .filter(v -> v.getAssignedTo() != null)
                .collect(Collectors.groupingBy(v -> v.getAssignedTo().getId()));

        Set<UUID> allUserIds = new HashSet<>(oppsByUser.keySet());
        allUserIds.addAll(visitsByUser.keySet());

        List<RepTrendDto> repTrends = new ArrayList<>();
        for (UUID userId : allUserIds) {
            List<Opportunity> userOpps = oppsByUser.getOrDefault(userId, Collections.emptyList());
            List<Visit> userVisits = visitsByUser.getOrDefault(userId, Collections.emptyList());

            String repName = userOpps.stream().findFirst()
                    .map(o -> o.getAssignedTo().getFullName())
                    .orElseGet(() -> userVisits.stream().findFirst()
                            .map(v -> v.getAssignedTo().getFullName())
                            .orElse("Unknown"));

            repTrends.add(RepTrendDto.builder()
                    .userId(userId)
                    .repName(repName)
                    .months(buildMonthlyTrend(userOpps, userVisits, monthLabels))
                    .build());
        }

        repTrends.sort(Comparator.comparing(RepTrendDto::getRepName));

        return TrendDataDto.builder()
                .teamTrend(teamTrend)
                .repTrends(repTrends)
                .monthsIncluded(MONTHS_BACK)
                .build();
    }

    private List<MonthlyTrendDto> buildMonthlyTrend(List<Opportunity> opps, List<Visit> visits,
                                                      List<String> monthLabels) {
        Map<String, List<Opportunity>> oppsByMonth = opps.stream()
                .filter(o -> o.getCloseDate() != null)
                .collect(Collectors.groupingBy(o -> YearMonth.from(o.getCloseDate()).format(MONTH_FMT)));

        Map<String, List<Opportunity>> createdByMonth = opps.stream()
                .filter(o -> o.getCreatedAt() != null)
                .collect(Collectors.groupingBy(o ->
                        YearMonth.from(o.getCreatedAt().atZone(ZONE).toLocalDate()).format(MONTH_FMT)));

        Map<String, List<Visit>> visitsByMonth = visits.stream()
                .filter(v -> v.getVisitDate() != null)
                .collect(Collectors.groupingBy(v ->
                        YearMonth.from(v.getVisitDate().atZone(ZONE).toLocalDate()).format(MONTH_FMT)));

        List<MonthlyTrendDto> result = new ArrayList<>();
        for (String month : monthLabels) {
            List<Opportunity> monthOpps = oppsByMonth.getOrDefault(month, Collections.emptyList());
            List<Opportunity> monthCreated = createdByMonth.getOrDefault(month, Collections.emptyList());
            List<Visit> monthVisits = visitsByMonth.getOrDefault(month, Collections.emptyList());

            long won = monthOpps.stream()
                    .filter(o -> Boolean.TRUE.equals(o.getIsClosed()) && Boolean.TRUE.equals(o.getIsWon()))
                    .count();
            long lost = monthOpps.stream()
                    .filter(o -> Boolean.TRUE.equals(o.getIsClosed()) && !Boolean.TRUE.equals(o.getIsWon()))
                    .count();

            BigDecimal revenue = monthOpps.stream()
                    .filter(o -> Boolean.TRUE.equals(o.getIsClosed()) && Boolean.TRUE.equals(o.getIsWon()))
                    .map(o -> o.getAmount() != null ? o.getAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal pipeline = monthCreated.stream()
                    .filter(o -> !Boolean.TRUE.equals(o.getIsClosed()))
                    .map(o -> o.getAmount() != null ? o.getAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            double winRate = (won + lost) > 0
                    ? Math.round((double) won / (won + lost) * 10000.0) / 100.0
                    : 0.0;

            long totalVisits = monthVisits.size();
            long completed = monthVisits.stream()
                    .filter(v -> "completed".equalsIgnoreCase(v.getStatus()))
                    .count();
            double visitCompRate = totalVisits > 0
                    ? Math.round((double) completed / totalVisits * 10000.0) / 100.0
                    : 0.0;

            result.add(MonthlyTrendDto.builder()
                    .month(month)
                    .revenue(revenue)
                    .dealsWon(won)
                    .dealsLost(lost)
                    .winRate(winRate)
                    .pipeline(pipeline)
                    .newDeals(monthCreated.size())
                    .visits(totalVisits)
                    .completedVisits(completed)
                    .visitCompletionRate(visitCompRate)
                    .build());
        }
        return result;
    }
}
