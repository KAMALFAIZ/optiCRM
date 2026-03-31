package com.opticrm.finance.dto;

import com.opticrm.finance.entity.Invoice;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceDto {

    private UUID id;
    private String invoiceNumber;
    private Invoice.InvoiceType invoiceType;
    private Invoice.InvoiceStatus status;
    private AccountSummaryDto account;
    private UUID contactId;
    private UUID quoteId;
    private UUID orderId;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal total;
    private BigDecimal amountPaid;
    private BigDecimal amountDue;
    private String currency;
    private String billingName;
    private String billingStreet;
    private String billingCity;
    private String billingState;
    private String billingPostalCode;
    private String billingCountry;
    private UUID paymentTermsId;
    private String notes;
    private String pdfUrl;
    private UserSummaryDto createdBy;
    private List<InvoiceLineDto> lines;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant sentAt;
    private Instant paidAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccountSummaryDto {
        private UUID id;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummaryDto {
        private UUID id;
        private String fullName;
    }
}
