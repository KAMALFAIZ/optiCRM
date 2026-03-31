package com.opticrm.stock.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {

    @NotBlank(message = "Le code est obligatoire")
    @Size(max = 50, message = "Le code ne doit pas dépasser 50 caractères")
    private String code;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 255, message = "Le nom ne doit pas dépasser 255 caractères")
    private String name;

    @Size(max = 2000, message = "La description ne doit pas dépasser 2000 caractères")
    private String description;

    private String categoryId;

    @Size(max = 100, message = "La marque ne doit pas dépasser 100 caractères")
    private String brand;

    @NotNull(message = "Le prix unitaire est obligatoire")
    @DecimalMin(value = "0.00", message = "Le prix unitaire doit être positif")
    private BigDecimal unitPrice;

    @DecimalMin(value = "0.00", message = "Le prix de revient doit être positif")
    private BigDecimal costPrice;

    @Size(max = 3, message = "La devise doit être de 3 caractères")
    private String currency;

    @Size(max = 20, message = "L'unité de mesure ne doit pas dépasser 20 caractères")
    private String unitOfMeasure;

    private Boolean isStockable;

    @DecimalMin(value = "0", message = "Le stock minimum doit être positif")
    private BigDecimal minStockLevel;

    @DecimalMin(value = "0", message = "Le niveau de réapprovisionnement doit être positif")
    private BigDecimal reorderLevel;

    private String defaultTaxRateId;

    private Boolean isActive;
    private Boolean isSellable;
    private Boolean isPurchasable;

    @Size(max = 500, message = "L'URL de l'image ne doit pas dépasser 500 caractères")
    private String imageUrl;
}
