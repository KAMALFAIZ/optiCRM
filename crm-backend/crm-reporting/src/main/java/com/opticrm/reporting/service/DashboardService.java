package com.opticrm.reporting.service;

import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.contact.repository.ContactRepository;
import com.opticrm.core.lead.repository.LeadRepository;
import com.opticrm.core.opportunity.repository.OpportunityRepository;
import com.opticrm.finance.repository.InvoiceRepository;
import com.opticrm.finance.repository.PaymentRepository;
import com.opticrm.reporting.dto.DashboardStatsDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DashboardService {

    private final AccountRepository accountRepository;
    private final ContactRepository contactRepository;
    private final LeadRepository leadRepository;
    private final OpportunityRepository opportunityRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    public DashboardStatsDto getStats() {
        log.debug("Building dashboard stats");

        // Entity counts
        long totalAccounts = accountRepository.count();
        long totalContacts = contactRepository.count();
        long totalLeads = leadRepository.countActive();
        long totalOpportunities = opportunityRepository.count();

        // Pipeline
        BigDecimal pipelineTotal = nullSafe(opportunityRepository.sumOpenAmount());
        BigDecimal pipelineWeighted = nullSafe(opportunityRepository.sumWeightedAmount());

        // Won deals
        long wonThisMonth = opportunityRepository.countWon(); // total won - used as base
        long wonThisYear = opportunityRepository.countWon();

        // Revenue from payments
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());
        LocalDate startOfYear = now.withDayOfYear(1);
        LocalDate endOfYear = now.withMonth(12).withDayOfMonth(31);

        BigDecimal revenueThisMonth = nullSafe(paymentRepository.sumByDateRange(startOfMonth, endOfMonth));
        BigDecimal revenueThisYear = nullSafe(paymentRepository.sumByDateRange(startOfYear, endOfYear));

        // Conversion rate: converted leads / (active + converted leads)
        long activeLeads = leadRepository.countActive();
        long convertedLeads = leadRepository.countConverted();
        double conversionRate = 0.0;
        if (activeLeads + convertedLeads > 0) {
            conversionRate = (double) convertedLeads / (activeLeads + convertedLeads) * 100.0;
        }

        // Leads by source
        Map<String, Long> leadsBySource = new LinkedHashMap<>();
        List<Object[]> sourceGroups = leadRepository.countBySourceGrouped();
        for (Object[] row : sourceGroups) {
            String source = row[0] != null ? row[0].toString() : "Unknown";
            Long count = ((Number) row[1]).longValue();
            leadsBySource.put(source, count);
        }

        // Revenue by month (last 12 months)
        List<DashboardStatsDto.MonthlyRevenue> revenueByMonth = buildRevenueByMonth(12);

        return DashboardStatsDto.builder()
                .totalAccounts(totalAccounts)
                .totalContacts(totalContacts)
                .totalLeads(totalLeads)
                .totalOpportunities(totalOpportunities)
                .pipelineTotal(pipelineTotal)
                .pipelineWeighted(pipelineWeighted)
                .wonThisMonth(wonThisMonth)
                .wonThisYear(wonThisYear)
                .revenueThisMonth(revenueThisMonth)
                .revenueThisYear(revenueThisYear)
                .conversionRate(Math.round(conversionRate * 100.0) / 100.0)
                .leadsBySource(leadsBySource)
                .revenueByMonth(revenueByMonth)
                .build();
    }

    private List<DashboardStatsDto.MonthlyRevenue> buildRevenueByMonth(int months) {
        List<DashboardStatsDto.MonthlyRevenue> result = new ArrayList<>();
        YearMonth current = YearMonth.now();

        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            LocalDate start = ym.atDay(1);
            LocalDate end = ym.atEndOfMonth();

            BigDecimal amount = nullSafe(paymentRepository.sumByDateRange(start, end));
            result.add(DashboardStatsDto.MonthlyRevenue.builder()
                    .month(ym.format(MONTH_FORMATTER))
                    .amount(amount)
                    .build());
        }

        return result;
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
