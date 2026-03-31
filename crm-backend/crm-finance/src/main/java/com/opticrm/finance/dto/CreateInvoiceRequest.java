package com.opticrm.finance.dto;

import com.opticrm.finance.entity.Invoice;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvoiceRequest {

    private Invoice.InvoiceType invoiceType;

    @NotNull(message = "Le compte est obligatoire")
    private UUID accountId;

    private UUID contactId;
    private UUID quoteId;
    private UUID orderId;

    @NotNull(message = "La date de facture est obligatoire")
    private LocalDate invoiceDate;

    @NotNull(message = "La date d'échéance est obligatoire")
    private LocalDate dueDate;

    private BigDecimal discountAmount;

    @Size(max = 3, message = "La devise ne doit pas dépasser 3 caractères")
    private String currency;

    private String billingName;
    private String billingStreet;
    private String billingCity;
    private String billingState;
    private String billingPostalCode;
    private String billingCountry;

    private UUID paymentTermsId;
    private String notes;

    @Valid
    private List<InvoiceLineRequest> lines;
}
