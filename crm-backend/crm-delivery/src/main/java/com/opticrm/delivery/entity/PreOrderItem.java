package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "pre_order_item")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PreOrderItem extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "pre_order_id", nullable = false)
    private PreOrder preOrder;

    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    @Column(name = "quantity_ordered", nullable = false)
    private Integer quantityOrdered = 0;

    @Column(name = "quantity_confirmed", nullable = false)
    private Integer quantityConfirmed = 0;

    @Column(name = "unit_price", precision = 10, scale = 2)
    private BigDecimal unitPrice;
}
