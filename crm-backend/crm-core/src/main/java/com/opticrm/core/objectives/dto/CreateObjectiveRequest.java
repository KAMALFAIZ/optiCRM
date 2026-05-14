package com.opticrm.core.objectives.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

public record CreateObjectiveRequest(
        @NotNull UUID userId,
        @NotNull UUID productId,
        @NotNull @Min(2020) @Max(2099) Integer periodYear,
        @Min(1) @Max(12) Integer periodMonth,   // null = annuel
        @NotNull @DecimalMin("0") BigDecimal targetQty,
        @NotNull @DecimalMin("0") BigDecimal targetAmount,
        String notes
) {}
