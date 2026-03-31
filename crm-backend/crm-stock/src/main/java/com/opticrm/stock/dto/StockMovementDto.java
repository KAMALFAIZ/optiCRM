package com.opticrm.stock.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StockMovementDto {

    private String id;
    private ProductSummary product;
    private WarehouseSummary warehouse;

    private String movementType;
    private String movementTypeLabel; // Human readable label
    private BigDecimal quantity;
    private BigDecimal unitCost;

    private String referenceType;
    private String referenceId;
    private String referenceLabel; // e.g. "Devis DEV-2024-001"

    private BigDecimal quantityAfter;
    private String notes;

    private UserSummary createdBy;
    private Instant createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductSummary {
        private String id;
        private String code;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WarehouseSummary {
        private String id;
        private String code;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private String id;
        private String fullName;
    }
}
