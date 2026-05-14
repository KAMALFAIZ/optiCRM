package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "return_entry")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnEntry extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "delivery_tour_id", nullable = false)
    private DeliveryTour deliveryTour;

    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "reason")
    private String reason;

    @Column(name = "received_date")
    private LocalDateTime receivedDate;

    @Column(name = "warehouse_to_id", nullable = false)
    private UUID warehouseToId;

    @Enumerated(EnumType.STRING)
    @Column(name = "return_type")
    private ReturnType returnType = ReturnType.VEHICLE_RETURN;

    // Lien vers la ligne de livraison d'origine (obligatoire pour CUSTOMER_RETURN)
    @Column(name = "delivery_line_id")
    private UUID deliveryLineId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ReturnStatus status = ReturnStatus.DRAFT;

    public enum ReturnType {
        VEHICLE_RETURN,   // Invendu retourné au dépôt en fin de tournée
        CUSTOMER_RETURN   // Avoir client : produit défectueux ou erreur de livraison
    }

    public enum ReturnStatus {
        DRAFT, RECEIVED, VALIDATED
    }
}
