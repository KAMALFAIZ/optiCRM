package com.opticrm.core.objectives.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SaleEntryDto(
        UUID id,
        UUID userId,
        String userName,
        UUID productId,
        String productCode,
        String productName,
        UUID accountId,
        String accountName,
        LocalDate saleDate,
        BigDecimal qty,
        BigDecimal unitPrice,
        BigDecimal totalAmount,
        String notes,
        Instant createdAt
) {}
