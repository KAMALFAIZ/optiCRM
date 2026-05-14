package com.opticrm.delivery.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RepObjectiveDTO {
    private UUID id;
    private UUID representativeId;
    private Integer year;
    private Integer month;
    private BigDecimal revenueTarget;
    private Integer visitTarget;
    private Integer deliveryTarget;
    private String notes;

    // Réalisé (calculé à la volée)
    private BigDecimal revenueActual;
    private Integer visitActual;
    private Integer deliveryActual;

    // Taux d'avancement (%)
    private Integer revenueRate;
    private Integer visitRate;
    private Integer deliveryRate;
}
