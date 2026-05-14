package com.opticrm.delivery.dto;

import lombok.*;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReplenishmentItemDTO {
    private UUID id;
    private UUID replenishmentId;
    private UUID itemId;
    private Integer quantity;
    private String notes;
}
