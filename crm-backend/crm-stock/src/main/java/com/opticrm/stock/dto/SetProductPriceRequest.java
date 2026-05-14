package com.opticrm.stock.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetProductPriceRequest {

    @NotBlank(message = "L'identifiant de la catégorie tarifaire est obligatoire")
    private String pricingCategoryId;

    @NotNull(message = "Le prix est obligatoire")
    @DecimalMin(value = "0.00", message = "Le prix doit être positif")
    private BigDecimal unitPrice;

    private String currency;
}
