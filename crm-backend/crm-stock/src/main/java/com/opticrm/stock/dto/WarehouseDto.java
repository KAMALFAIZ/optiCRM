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
public class WarehouseDto {

    private String id;
    private String code;
    private String name;
    private String addressStreet;
    private String addressCity;
    private String addressPostalCode;
    private String addressCountry;
    private String fullAddress;
    private Boolean isDefault;
    private Boolean isActive;

    // Stats (optional)
    private Long productCount;
    private BigDecimal totalValue;

    private Instant createdAt;
}
