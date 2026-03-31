package com.opticrm.stock.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateStockMovementRequest {

    @NotBlank(message = "Le produit est obligatoire")
    private String productId;

    @NotBlank(message = "L'entrepôt est obligatoire")
    private String warehouseId;

    @NotBlank(message = "Le type de mouvement est obligatoire")
    @Size(max = 50, message = "Le type de mouvement ne doit pas dépasser 50 caractères")
    private String movementType; // PURCHASE, SALE, ADJUSTMENT, RETURN, TRANSFER, DAMAGE, INVENTORY

    @NotNull(message = "La quantité est obligatoire")
    private BigDecimal quantity; // Positive for IN, Negative for OUT

    @DecimalMin(value = "0", message = "Le coût unitaire doit être positif")
    private BigDecimal unitCost;

    @Size(max = 50, message = "Le type de référence ne doit pas dépasser 50 caractères")
    private String referenceType;

    private String referenceId;

    @Size(max = 500, message = "Les notes ne doivent pas dépasser 500 caractères")
    private String notes;
}
