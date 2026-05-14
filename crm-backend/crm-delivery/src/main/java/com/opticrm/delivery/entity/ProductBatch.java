package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "product_batch")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductBatch extends BaseEntity {

    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    @Column(name = "batch_number", nullable = false, length = 100)
    private String batchNumber;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "quantity", nullable = false)
    private Integer quantity = 0;

    @Column(name = "warehouse_id")
    private UUID warehouseId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private BatchStatus status = BatchStatus.ACTIVE;

    @Column(name = "notes", length = 500)
    private String notes;

    public enum BatchStatus {
        ACTIVE,   // En stock
        CONSUMED, // Entièrement utilisé
        EXPIRED,  // Périmé
        RECALLED  // Rappel produit
    }
}
