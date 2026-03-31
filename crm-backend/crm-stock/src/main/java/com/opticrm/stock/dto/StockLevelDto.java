package com.opticrm.stock.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StockLevelDto {

    private String id;
    private ProductSummary product;
    private WarehouseSummary warehouse;

    private BigDecimal quantityOnHand;
    private BigDecimal quantityReserved;
    private BigDecimal quantityAvailable;
    private BigDecimal quantityOnOrder;
    private BigDecimal averageCost;
    private BigDecimal totalValue;

    private LocalDate lastCountDate;
    private Instant updatedAt;

    // Calculated status
    private Boolean isLowStock;
    private Boolean needsReorder;
    private String stockStatus; // OK, LOW, CRITICAL, OUT_OF_STOCK

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductSummary {
        private String id;
        private String code;
        private String name;
        private String unitOfMeasure;
        private BigDecimal minStockLevel;
        private BigDecimal reorderLevel;
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
}
