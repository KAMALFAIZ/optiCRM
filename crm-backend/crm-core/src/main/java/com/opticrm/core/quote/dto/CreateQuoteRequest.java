package com.opticrm.core.quote.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateQuoteRequest {

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 255)
    private String name;

    @NotNull(message = "Le compte est obligatoire")
    private String accountId;

    private String contactId;
    private String opportunityId;
    private String chantierId;
    private String assignedToId;

    private LocalDate quoteDate;

    @NotNull(message = "La date de validité est obligatoire")
    private LocalDate validUntil;

    @Size(max = 3)
    private String currency = "MAD";

    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal discountAmount;

    private String terms;
    private String notes;
    private String billingAddress;
    private String shippingAddress;

    @Valid
    private List<LineItemRequest> lineItems;

    private List<String> tags;

    @Data
    public static class LineItemRequest {
        private String productId;

        @NotBlank(message = "Le nom du produit est obligatoire")
        private String name;

        private String description;
        private String sku;

        @NotNull(message = "La quantité est obligatoire")
        private BigDecimal quantity;

        private String unit;

        @NotNull(message = "Le prix unitaire est obligatoire")
        private BigDecimal unitPrice;

        private BigDecimal discountPercent;
        private BigDecimal discountAmount;
        private BigDecimal taxPercent;
        private Integer sortOrder;
    }
}
