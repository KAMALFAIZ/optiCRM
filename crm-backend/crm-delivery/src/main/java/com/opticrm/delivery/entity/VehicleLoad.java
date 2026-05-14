package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "vehicle_load")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleLoad extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "delivery_tour_id", nullable = false)
    private DeliveryTour deliveryTour;

    @Column(name = "load_date", nullable = false)
    private LocalDateTime loadDate;

    @Column(name = "warehouse_from_id")
    private UUID warehouseFromId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private LoadStatus status = LoadStatus.DRAFT;

    @OneToMany(mappedBy = "vehicleLoad", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<VehicleLoadItem> items = new ArrayList<>();

    public enum LoadStatus {
        DRAFT,   // En attente de confirmation
        LOADED   // Confirmé — chargé sur le véhicule
    }
}
