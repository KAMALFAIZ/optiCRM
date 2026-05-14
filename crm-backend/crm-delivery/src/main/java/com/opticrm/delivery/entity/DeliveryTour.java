package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "delivery_tour")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryTour extends BaseEntity {

    @Column(name = "tour_date", nullable = false)
    private LocalDate tourDate;

    @Column(name = "representative_id")
    private UUID representativeId;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @Column(name = "zone")
    private String zone;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TourStatus status = TourStatus.DRAFT;

    @OneToMany(mappedBy = "deliveryTour", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DeliveryLine> deliveryLines;

    @OneToMany(mappedBy = "deliveryTour", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VehicleLoad> vehicleLoads;

    @OneToMany(mappedBy = "deliveryTour", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReturnEntry> returnEntries;

    public enum TourStatus {
        DRAFT,
        VALIDE,
        EN_COURS,   // Tournée démarrée sur le terrain (1ère livraison ou TOUR_START GPS)
        CLOSED
    }
}
