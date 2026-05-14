package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Règle de gratuité / promotion volume.
 * Exemple : "Achetez 10 unités de l'article A → recevez 1 unité de B gratuite"
 */
@Entity
@Table(name = "delivery_promotion")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DeliveryPromotion extends BaseEntity {

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    // Article déclencheur (celui qui est vendu)
    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    // Quantité minimale pour déclencher la promotion
    @Column(name = "min_quantity", nullable = false)
    private Integer minQuantity = 1;

    // Article offert gratuitement (peut être identique à itemId)
    @Column(name = "bonus_item_id", nullable = false)
    private UUID bonusItemId;

    // Quantité offerte par palier atteint
    @Column(name = "bonus_quantity", nullable = false)
    private Integer bonusQuantity = 1;

    // Zone géographique concernée (NULL = toutes zones)
    @Column(name = "zone", length = 100)
    private String zone;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
