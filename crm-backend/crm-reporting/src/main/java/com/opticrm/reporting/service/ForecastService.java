package com.opticrm.reporting.service;

import com.opticrm.core.opportunity.entity.Opportunity;
import com.opticrm.core.opportunity.repository.OpportunityRepository;
import com.opticrm.reporting.dto.ForecastDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ForecastService {

    private final OpportunityRepository opportunityRepository;

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    /**
     * Monthly forecast for the next N months based on opportunity close dates.
     */
    public List<ForecastDto.ForecastByMonth> getMonthlyForecast(int months) {
        log.debug("Building monthly forecast for {} months", months);

        List<Opportunity> allOpportunities = opportunityRepository.findAll();
        YearMonth current = YearMonth.now();

        List<ForecastDto.ForecastByMonth> result = new ArrayList<>();

        for (int i = 0; i < months; i++) {
            YearMonth targetMonth = current.plusMonths(i);
            String monthKey = targetMonth.format(MONTH_FORMATTER);

            // Filter opportunities whose closeDate falls in this month
            List<Opportunity> monthOpps = allOpportunities.stream()
                    .filter(o -> o.getCloseDate() != null)
                    .filter(o -> YearMonth.from(o.getCloseDate()).equals(targetMonth))
                    .toList();

            BigDecimal pipeline = BigDecimal.ZERO;
            BigDecimal weighted = BigDecimal.ZERO;
            BigDecimal won = BigDecimal.ZERO;
            long count = monthOpps.size();

            for (Opportunity o : monthOpps) {
                BigDecimal amount = o.getAmount() != null ? o.getAmount() : BigDecimal.ZERO;

                if (Boolean.TRUE.equals(o.getIsClosed()) && Boolean.TRUE.equals(o.getIsWon())) {
                    won = won.add(amount);
                } else if (!Boolean.TRUE.equals(o.getIsClosed())) {
                    pipeline = pipeline.add(amount);
                    weighted = weighted.add(o.getWeightedAmountCalculated());
                }
            }

            result.add(ForecastDto.ForecastByMonth.builder()
                    .month(monthKey)
                    .pipeline(pipeline)
                    .weighted(weighted)
                    .won(won)
                    .opportunityCount(count)
                    .build());
        }

        return result;
    }

    /**
     * Forecast grouped by sales rep (assignedTo user).
     */
    public List<ForecastDto.ForecastByRep> getByRep() {
        log.debug("Building forecast by rep");

        List<Opportunity> allOpportunities = opportunityRepository.findAll();

        // Group by assignedTo user
        Map<UUID, List<Opportunity>> byUser = allOpportunities.stream()
                .filter(o -> o.getAssignedTo() != null)
                .collect(Collectors.groupingBy(o -> o.getAssignedTo().getId()));

        List<ForecastDto.ForecastByRep> result = new ArrayList<>();

        for (Map.Entry<UUID, List<Opportunity>> entry : byUser.entrySet()) {
            UUID userId = entry.getKey();
            List<Opportunity> userOpps = entry.getValue();

            String userName = userOpps.stream()
                    .findFirst()
                    .map(o -> o.getAssignedTo().getFullName())
                    .orElse("Unknown");

            BigDecimal pipeline = BigDecimal.ZERO;
            BigDecimal weighted = BigDecimal.ZERO;
            BigDecimal won = BigDecimal.ZERO;
            long count = userOpps.size();
            long wonCount = 0;
            long closedCount = 0;

            for (Opportunity o : userOpps) {
                BigDecimal amount = o.getAmount() != null ? o.getAmount() : BigDecimal.ZERO;

                if (Boolean.TRUE.equals(o.getIsClosed())) {
                    closedCount++;
                    if (Boolean.TRUE.equals(o.getIsWon())) {
                        wonCount++;
                        won = won.add(amount);
                    }
                } else {
                    pipeline = pipeline.add(amount);
                    weighted = weighted.add(o.getWeightedAmountCalculated());
                }
            }

            double winRate = closedCount > 0 ? (double) wonCount / closedCount * 100.0 : 0.0;
            winRate = Math.round(winRate * 100.0) / 100.0;

            result.add(ForecastDto.ForecastByRep.builder()
                    .userId(userId)
                    .repName(userName)
                    .pipeline(pipeline)
                    .weighted(weighted)
                    .won(won)
                    .opportunityCount(count)
                    .winRate(winRate)
                    .build());
        }

        // Sort by pipeline descending
        result.sort((a, b) -> b.getPipeline().compareTo(a.getPipeline()));

        return result;
    }
}
