package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Ligne gratuite générée automatiquement par une règle de promotion.
 * Liée à la ligne de livraison qui a déclenché la promotion.
 */
@Entity
@Table(name = "delivery_line_bonus")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DeliveryLineBonus extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "delivery_line_id", nullable = false)
    private DeliveryLine deliveryLine;

    @ManyToOne
    @JoinColumn(name = "promotion_id", nullable = false)
    private DeliveryPromotion promotion;

    @Column(name = "bonus_item_id", nullable = false)
    private UUID bonusItemId;

    @Column(name = "bonus_quantity", nullable = false)
    private Integer bonusQuantity = 0;
}
