package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "pre_order")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PreOrder extends BaseEntity {

    // Nullable — la commande peut exister avant d'être rattachée à une tournée
    @Column(name = "delivery_tour_id")
    private UUID deliveryTourId;

    // Date de livraison souhaitée (prochaine visite prévue)
    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PreOrderStatus status = PreOrderStatus.PENDING;

    @Column(name = "notes", length = 500)
    private String notes;

    // Ordre de visite dans l'itinéraire optimisé (1-based, null = non séquencé)
    @Column(name = "visit_order")
    private Integer visitOrder;

    @OneToMany(mappedBy = "preOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PreOrderItem> items;

    public enum PreOrderStatus {
        PENDING,    // En attente de confirmation
        CONFIRMED,  // Confirmée — chargement généré
        DELIVERED,  // Livrée
        CANCELLED   // Annulée
    }
}
