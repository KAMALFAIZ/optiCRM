package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Tarif spécifique par client ou catégorie tarifaire.
 * Hiérarchie de résolution : client > catégorie > prix produit.
 */
@Entity
@Table(name = "delivery_price_override")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryPriceOverride extends BaseEntity {

    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    // Si renseigné, s'applique uniquement à ce client (priorité maximale)
    @Column(name = "customer_id")
    private UUID customerId;

    // Si renseigné (sans customerId), s'applique à toute la catégorie tarifaire
    @Column(name = "pricing_category_id")
    private UUID pricingCategoryId;

    @Column(name = "unit_price", precision = 18, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "notes", length = 500)
    private String notes;
}
