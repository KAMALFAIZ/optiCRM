package com.opticrm.core.objectives.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ObjectiveDto(
        UUID id,
        UUID userId,
        String userName,
        UUID productId,
        String productCode,
        String productName,
        Integer periodYear,
        Integer periodMonth,
        BigDecimal targetQty,
        BigDecimal targetAmount,
        String notes,
        Instant createdAt
) {}
