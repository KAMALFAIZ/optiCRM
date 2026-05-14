package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "vehicle_load_item")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleLoadItem extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "vehicle_load_id", nullable = false)
    private VehicleLoad vehicleLoad;

    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    // Traçabilité lot (FEFO)
    @Column(name = "batch_id")
    private UUID batchId;

    @Column(name = "lot_number", length = 100)
    private String lotNumber;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;
}
