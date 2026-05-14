package com.opticrm.stock.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductDto {

    private String id;
    private String code;
    private String name;
    private String description;
    private CategorySummary category;
    private String brand;

    // Pricing
    private BigDecimal unitPrice;
    private BigDecimal costPrice;
    private String currency;
    private BigDecimal margin; // Calculated
    private BigDecimal profit; // Calculated

    // Stock settings
    private String unitOfMeasure;
    private Boolean isStockable;
    private BigDecimal minStockLevel;
    private BigDecimal reorderLevel;

    // Tax
    private TaxRateSummary defaultTaxRate;

    // Status
    private Boolean isActive;
    private Boolean isSellable;
    private Boolean isPurchasable;

    // Media
    private String imageUrl;
    private String datasheetUrl;
    private String datasheetName;

    // Pricing per category (optional, loaded separately)
    private List<ProductPriceDto> prices;

    // Stock info (optional, loaded separately)
    private List<StockInfo> stockLevels;
    private BigDecimal totalStock;

    // Audit
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategorySummary {
        private String id;
        private String code;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaxRateSummary {
        private String id;
        private String code;
        private String name;
        private BigDecimal rate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockInfo {
        private String warehouseId;
        private String warehouseName;
        private String warehouseCode;
        private BigDecimal quantityOnHand;
        private BigDecimal quantityReserved;
        private BigDecimal quantityAvailable;
    }
}
