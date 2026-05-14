package com.opticrm.core.objectives.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** Ligne de suivi : objectif vs réalisé pour un commercial × article × période */
public record ObjectiveTrackingDto(
        UUID userId,
        String userName,
        UUID productId,
        String productCode,
        String productName,
        Integer periodYear,
        Integer periodMonth,

        // Objectif
        BigDecimal targetQty,
        BigDecimal targetAmount,

        // Réalisé
        BigDecimal actualQty,
        BigDecimal actualAmount,

        // KPIs
        BigDecimal achievementQtyPct,    // % atteinte quantité
        BigDecimal achievementAmountPct, // % atteinte CA
        String status                    // ON_TRACK, AT_RISK, EXCEEDED, NO_OBJECTIVE
) {}
