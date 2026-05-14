package com.opticrm.delivery.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.Instant;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductBatchDTO {
    private UUID id;
    private UUID itemId;
    private String batchNumber;
    private LocalDate expiryDate;
    private Integer quantity;
    private UUID warehouseId;
    private String status;
    private String notes;
    private Instant createdAt;
    // champs calculés
    private Integer daysUntilExpiry;   // null si pas de date
    private String expiryAlert;        // "EXPIRED" | "CRITICAL" (≤7j) | "WARNING" (≤30j) | "OK"
}
