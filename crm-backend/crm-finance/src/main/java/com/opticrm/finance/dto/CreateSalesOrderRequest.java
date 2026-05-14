package com.opticrm.finance.dto;

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
public class CreateSalesOrderRequest {

    @NotNull(message = "Le compte est obligatoire")
    private UUID accountId;

    private UUID contactId;
    private UUID quoteId;

    @NotNull(message = "La date de commande est obligatoire")
    private LocalDate orderDate;

    private LocalDate expectedDeliveryDate;

    /** Lines drive totals if provided; otherwise manual totals are used. */
    private List<LineRequest> lines;

    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal total;

    @Size(max = 3, message = "La devise ne doit pas dépasser 3 caractères")
    private String currency;

    private String shippingStreet;
    private String shippingCity;
    private String shippingState;
    private String shippingPostalCode;
    private String shippingCountry;
    private String notes;
    private UUID assignedToId;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LineRequest {
        private UUID productId;
        private String productCode;
        private String productName;
        private String description;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private String unitOfMeasure;
        private BigDecimal discountPercent;
        private BigDecimal taxRate;
        private Integer sortOrder;
    }
}
