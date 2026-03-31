package com.opticrm.core.objectives.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateSaleEntryRequest(
        @NotNull UUID userId,
        @NotNull UUID productId,
        UUID accountId,
        @NotNull LocalDate saleDate,
        @NotNull @DecimalMin("0.001") BigDecimal qty,
        @NotNull @DecimalMin("0") BigDecimal unitPrice,
        String notes
) {}
