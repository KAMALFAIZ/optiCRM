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
public class InvoiceStatsDto {

    private long totalInvoices;
    private BigDecimal totalInvoiced;
    private BigDecimal totalPaid;
    private BigDecimal totalDue;
    private long overdueCount;
    private BigDecimal overdueAmount;
    private long draftCount;
    private long sentCount;
    private long paidCount;
}
