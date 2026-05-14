package com.opticrm.stock.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductPriceDto {

    private String id;
    private String categoryId;
    private String categoryCode;
    private String categoryName;
    private Boolean categoryIsDefault;
    private BigDecimal unitPrice;
    private String currency;
}
