package com.opticrm.reporting.service;

import com.opticrm.core.opportunity.entity.Opportunity;
import com.opticrm.core.opportunity.repository.OpportunityRepository;
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

    /**
     * Commercial KPIs grouped by sales rep.
     */
    public List<CommercialKpiDto> getCommercialKpis() {
        log.debug("Building commercial KPIs");

        List<Opportunity> allOpportunities = opportunityRepository.findAll();

        // Group by assignedTo user
        Map<UUID, List<Opportunity>> byUser = allOpportunities.stream()
                .filter(o -> o.getAssignedTo() != null)
                .collect(Collectors.groupingBy(o -> o.getAssignedTo().getId()));

        List<CommercialKpiDto> result = new ArrayList<>();

        for (Map.Entry<UUID, List<Opportunity>> entry : byUser.entrySet()) {
            UUID userId = entry.getKey();
            List<Opportunity> userOpps = entry.getValue();

            String userName = userOpps.stream()
                    .findFirst()
                    .map(o -> o.getAssignedTo().getFullName())
                    .orElse("Unknown");

            String email = userOpps.stream()
                    .findFirst()
                    .map(o -> o.getAssignedTo().getEmail())
                    .orElse(null);

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
                    .build());
        }

        // Sort by total revenue descending
        result.sort((a, b) -> b.getTotalRevenue().compareTo(a.getTotalRevenue()));

        return result;
    }
}
