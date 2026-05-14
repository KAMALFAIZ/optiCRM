package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "rep_location")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RepLocation extends BaseEntity {

    @Column(name = "representative_id", nullable = false)
    private UUID representativeId;

    @Column(name = "delivery_tour_id")
    private UUID deliveryTourId;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "accuracy")
    private Double accuracy;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType = EventType.TRACK;

    @Column(name = "customer_id")
    private UUID customerId;   // renseigné si event VISIT_START / VISIT_END

    public enum EventType {
        TRACK,        // Position périodique
        TOUR_START,   // Début de tournée
        TOUR_END,     // Fin de tournée
        VISIT_START,  // Arrivée chez client
        VISIT_END     // Départ client
    }
}
