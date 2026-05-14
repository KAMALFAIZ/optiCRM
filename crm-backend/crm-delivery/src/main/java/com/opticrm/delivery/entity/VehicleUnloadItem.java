package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "vehicle_unload_item")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class VehicleUnloadItem extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "unload_id", nullable = false)
    private VehicleUnload unload;

    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    @Column(name = "quantity_loaded", nullable = false)
    private Integer quantityLoaded = 0;

    @Column(name = "quantity_sold", nullable = false)
    private Integer quantitySold = 0;

    @Column(name = "quantity_returned", nullable = false)
    private Integer quantityReturned = 0;

    @Column(name = "quantity_unloaded", nullable = false)
    private Integer quantityUnloaded = 0;
}
