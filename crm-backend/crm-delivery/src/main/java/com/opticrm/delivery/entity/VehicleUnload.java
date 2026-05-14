package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "vehicle_unload")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class VehicleUnload extends BaseEntity {

    @Column(name = "delivery_tour_id", nullable = false)
    private UUID deliveryTourId;

    @Column(name = "unload_date")
    private LocalDateTime unloadDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private UnloadStatus status = UnloadStatus.DRAFT;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "confirmed_by")
    private UUID confirmedBy;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @OneToMany(mappedBy = "unload", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VehicleUnloadItem> items;

    public enum UnloadStatus {
        DRAFT,      // Généré automatiquement
        CONFIRMED   // Validé par le magasinier
    }
}
