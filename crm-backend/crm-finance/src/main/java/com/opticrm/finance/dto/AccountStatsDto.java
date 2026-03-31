package com.opticrm.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountStatsDto {

    // Contacts
    private long totalContacts;

    // Opportunities
    private long totalOpportunities;
    private long openOpportunities;
    private long wonOpportunities;
    private BigDecimal wonAmount;
    private BigDecimal openPipeline;

    // Revenue (Invoices)
    private BigDecimal totalRevenue;
    private BigDecimal totalPaid;
    private BigDecimal totalDue;
    private BigDecimal caCurrentYear;
    private BigDecimal caPreviousYear;

    // Overdue
    private long overdueInvoices;
    private BigDecimal overdueAmount;
}
