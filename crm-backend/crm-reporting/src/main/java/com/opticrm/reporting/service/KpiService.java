package com.opticrm.reporting.service;

import com.opticrm.core.opportunity.entity.Opportunity;
import com.opticrm.core.opportunity.repository.OpportunityRepository;
import com.opticrm.core.visit.entity.Visit;
import com.opticrm.core.visit.repository.VisitRepository;
import com.opticrm.reporting.dto.CommercialKpiDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class KpiService {

    private final OpportunityRepository opportunityRepository;
    private final VisitRepository visitRepository;

    public List<CommercialKpiDto> getCommercialKpis() {
        return getCommercialKpis(null);
    }

    /**
     * @param userFilter null = all users; non-null = only these user IDs
     */
    public List<CommercialKpiDto> getCommercialKpis(Set<UUID> userFilter) {
        log.debug("Building commercial KPIs (filter={})", userFilter == null ? "ALL" : userFilter.size() + " users");

        List<Opportunity> allOpportunities = opportunityRepository.findAll();
        List<Visit> allVisits = visitRepository.findAll();

        Map<UUID, List<Opportunity>> byUser = allOpportunities.stream()
                .filter(o -> o.getAssignedTo() != null)
                .filter(o -> userFilter == null || userFilter.contains(o.getAssignedTo().getId()))
                .collect(Collectors.groupingBy(o -> o.getAssignedTo().getId()));

        Map<UUID, List<Visit>> visitsByUser = allVisits.stream()
                .filter(v -> v.getAssignedTo() != null)
                .filter(v -> userFilter == null || userFilter.contains(v.getAssignedTo().getId()))
                .collect(Collectors.groupingBy(v -> v.getAssignedTo().getId()));

        Set<UUID> allUserIds = new HashSet<>(byUser.keySet());
        allUserIds.addAll(visitsByUser.keySet());

        List<CommercialKpiDto> result = new ArrayList<>();

        for (UUID userId : allUserIds) {
            List<Opportunity> userOpps = byUser.getOrDefault(userId, Collections.emptyList());
            List<Visit> userVisits = visitsByUser.getOrDefault(userId, Collections.emptyList());

            String userName = userOpps.stream()
                    .findFirst()
                    .map(o -> o.getAssignedTo().getFullName())
                    .orElseGet(() -> userVisits.stream()
                            .findFirst()
                            .map(v -> v.getAssignedTo().getFullName())
                            .orElse("Unknown"));

            String email = userOpps.stream()
                    .findFirst()
                    .map(o -> o.getAssignedTo().getEmail())
                    .orElseGet(() -> userVisits.stream()
                            .findFirst()
                            .map(v -> v.getAssignedTo().getEmail())
                            .orElse(null));

            long wonCount = 0;
            long lostCount = 0;
            BigDecimal totalRevenue = BigDecimal.ZERO;
            BigDecimal pipelineValue = BigDecimal.ZERO;
            long openDeals = 0;

            for (Opportunity o : userOpps) {
                BigDecimal amount = o.getAmount() != null ? o.getAmount() : BigDecimal.ZERO;

                if (Boolean.TRUE.equals(o.getIsClosed())) {
                    if (Boolean.TRUE.equals(o.getIsWon())) {
                        wonCount++;
                        totalRevenue = totalRevenue.add(amount);
                    } else {
                        lostCount++;
                    }
                } else {
                    openDeals++;
                    pipelineValue = pipelineValue.add(amount);
                }
            }

            double winRate = 0.0;
            if (wonCount + lostCount > 0) {
                winRate = (double) wonCount / (wonCount + lostCount) * 100.0;
                winRate = Math.round(winRate * 100.0) / 100.0;
            }

            BigDecimal averageDealSize = BigDecimal.ZERO;
            if (wonCount > 0) {
                averageDealSize = totalRevenue.divide(BigDecimal.valueOf(wonCount), 2, RoundingMode.HALF_UP);
            }

            long totalVisits = userVisits.size();
            long completedVisits = userVisits.stream()
                    .filter(v -> "completed".equalsIgnoreCase(v.getStatus()))
                    .count();
            long plannedVisits = userVisits.stream()
                    .filter(v -> "planned".equalsIgnoreCase(v.getStatus()))
                    .count();
            long inProgressVisits = userVisits.stream()
                    .filter(v -> "in_progress".equalsIgnoreCase(v.getStatus()))
                    .count();
            double visitCompletionRate = totalVisits > 0
                    ? Math.round((double) completedVisits / totalVisits * 10000.0) / 100.0
                    : 0.0;
            BigDecimal totalMileage = userVisits.stream()
                    .map(v -> v.getMileage() != null ? v.getMileage() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalExpenses = userVisits.stream()
                    .map(v -> v.getExpenses() != null ? v.getExpenses() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            result.add(CommercialKpiDto.builder()
                    .userId(userId)
                    .userName(userName)
                    .email(email)
                    .wonCount(wonCount)
                    .lostCount(lostCount)
                    .winRate(winRate)
                    .totalRevenue(totalRevenue)
                    .averageDealSize(averageDealSize)
                    .pipelineValue(pipelineValue)
                    .openDeals(openDeals)
                    .totalVisits(totalVisits)
                    .completedVisits(completedVisits)
                    .plannedVisits(plannedVisits)
                    .inProgressVisits(inProgressVisits)
                    .visitCompletionRate(visitCompletionRate)
                    .totalMileage(totalMileage)
                    .totalExpenses(totalExpenses)
                    .build());
        }

        result.sort((a, b) -> b.getTotalRevenue().compareTo(a.getTotalRevenue()));

        return result;
    }
}
