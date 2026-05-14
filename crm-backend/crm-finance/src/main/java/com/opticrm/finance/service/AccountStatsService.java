package com.opticrm.finance.service;

import com.opticrm.core.contact.repository.ContactRepository;
import com.opticrm.core.opportunity.repository.OpportunityRepository;
import com.opticrm.finance.dto.AccountStatsDto;
import com.opticrm.finance.repository.InvoiceRepository;
import com.opticrm.finance.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountStatsService {

    private final ContactRepository contactRepository;
    private final OpportunityRepository opportunityRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public AccountStatsDto getAccountStats(UUID accountId) {
        LocalDate today = LocalDate.now();
        int currentYear = today.getYear();
        int previousYear = currentYear - 1;

        // Contacts
        long totalContacts = contactRepository.countByAccountId(accountId);

        // Opportunities
        long totalOpportunities = opportunityRepository.countByAccountId(accountId);
        long openOpportunities = opportunityRepository.countOpenByAccountId(accountId);
        long wonOpportunities = opportunityRepository.countWonByAccountId(accountId);
        BigDecimal wonAmount = opportunityRepository.sumWonAmountByAccountId(accountId);
        BigDecimal openPipeline = opportunityRepository.sumOpenPipelineByAccountId(accountId);

        // Invoices - Revenue
        BigDecimal totalRevenue = invoiceRepository.sumTotalByAccountId(accountId);
        BigDecimal totalPaid = invoiceRepository.sumPaidByAccountId(accountId);
        BigDecimal totalDue = invoiceRepository.sumDueByAccountId(accountId);
        BigDecimal caCurrentYear = invoiceRepository.sumTotalByAccountIdAndYear(accountId, currentYear);
        BigDecimal caPreviousYear = invoiceRepository.sumTotalByAccountIdAndYear(accountId, previousYear);

        // Overdue
        long overdueInvoices = invoiceRepository.countOverdueByAccountId(accountId, today);
        BigDecimal overdueAmount = invoiceRepository.sumOverdueByAccountId(accountId, today);

        return AccountStatsDto.builder()
                .totalContacts(totalContacts)
                .totalOpportunities(totalOpportunities)
                .openOpportunities(openOpportunities)
                .wonOpportunities(wonOpportunities)
                .wonAmount(wonAmount != null ? wonAmount : BigDecimal.ZERO)
                .openPipeline(openPipeline != null ? openPipeline : BigDecimal.ZERO)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalPaid(totalPaid != null ? totalPaid : BigDecimal.ZERO)
                .totalDue(totalDue != null ? totalDue : BigDecimal.ZERO)
                .caCurrentYear(caCurrentYear != null ? caCurrentYear : BigDecimal.ZERO)
                .caPreviousYear(caPreviousYear != null ? caPreviousYear : BigDecimal.ZERO)
                .overdueInvoices(overdueInvoices)
                .overdueAmount(overdueAmount != null ? overdueAmount : BigDecimal.ZERO)
                .build();
    }
}
