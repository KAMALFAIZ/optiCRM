package com.opticrm.stock.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductListDto {

    private String id;
    private String code;
    private String name;
    private String categoryName;
    private String brand;
    private BigDecimal unitPrice;
    private BigDecimal costPrice;
    private String currency;
    private String unitOfMeasure;
    private Boolean isStockable;
    private Boolean isActive;
    private Boolean isSellable;
    private BigDecimal totalStock; // Total across all warehouses
    private String stockStatus; // OK, LOW, OUT_OF_STOCK
    private String imageUrl;
}
