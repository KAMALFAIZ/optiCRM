package com.opticrm.delivery.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DeliveryPromotionDTO {
    private UUID id;
    private String name;
    private String description;
    private UUID itemId;
    private Integer minQuantity;
    private UUID bonusItemId;
    private Integer bonusQuantity;
    private String zone;
    private LocalDate validFrom;
    private LocalDate validTo;
    private Boolean isActive;
}
