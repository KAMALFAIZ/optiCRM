package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "stock_replenishment_item")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReplenishmentItem extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "replenishment_id", nullable = false)
    private StockReplenishment replenishment;

    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "notes")
    private String notes;
}
