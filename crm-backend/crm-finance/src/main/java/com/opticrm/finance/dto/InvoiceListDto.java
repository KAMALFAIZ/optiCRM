package com.opticrm.finance.dto;

import com.opticrm.finance.entity.Invoice;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceListDto {

    private UUID id;
    private String invoiceNumber;
    private Invoice.InvoiceType invoiceType;
    private Invoice.InvoiceStatus status;
    private String accountName;
    private UUID accountId;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private BigDecimal total;
    private BigDecimal amountPaid;
    private BigDecimal amountDue;
    private String currency;
    private String createdByName;
    private boolean overdue;
}
