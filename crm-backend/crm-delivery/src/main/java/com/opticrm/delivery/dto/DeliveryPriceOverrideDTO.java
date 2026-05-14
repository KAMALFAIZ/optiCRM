package com.opticrm.delivery.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryPriceOverrideDTO {
    private UUID id;
    private UUID itemId;
    private UUID customerId;
    private UUID pricingCategoryId;
    private BigDecimal unitPrice;
    private LocalDate validFrom;
    private LocalDate validTo;
    private Boolean isActive;
    private String notes;
    // Champ lecture seule : source du prix résolu (CLIENT/CATEGORY/PRODUCT)
    private String resolvedSource;
}
