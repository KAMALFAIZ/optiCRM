package com.opticrm.core.quote.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateQuoteRequest {

    @Size(max = 255)
    private String name;

    private String status;

    private String accountId;
    private String contactId;
    private String opportunityId;
    private String chantierId;
    private String assignedToId;

    private LocalDate quoteDate;
    private LocalDate validUntil;

    @Size(max = 3)
    private String currency;

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
        private String id; // For existing items
        private String productId;
        private String name;
        private String description;
        private String sku;
        private BigDecimal quantity;
        private String unit;
        private BigDecimal unitPrice;
        private BigDecimal discountPercent;
        private BigDecimal discountAmount;
        private BigDecimal taxPercent;
        private Integer sortOrder;
    }
}
