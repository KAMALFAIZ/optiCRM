package com.opticrm.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceLineRequest {

    private UUID productId;

    private String productCode;

    @NotBlank(message = "La description est obligatoire")
    private String description;

    @NotNull(message = "La quantité est obligatoire")
    @DecimalMin(value = "0.001", message = "La quantité doit être supérieure à 0")
    private BigDecimal quantity;

    @NotNull(message = "Le prix unitaire est obligatoire")
    @DecimalMin(value = "0", message = "Le prix unitaire ne peut pas être négatif")
    private BigDecimal unitPrice;

    private BigDecimal discountAmount;

    private BigDecimal taxRate;

    private Integer sortOrder;
}
