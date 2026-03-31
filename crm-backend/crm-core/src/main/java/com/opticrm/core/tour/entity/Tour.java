package com.opticrm.core.tour.entity;

import com.opticrm.security.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tours")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Tour {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "tour_date", nullable = false)
    private LocalDate tourDate;

    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "draft";

    @Column(name = "region", length = 100)
    private String region;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @Column(name = "total_visits")
    @Builder.Default
    private Integer totalVisits = 0;

    @Column(name = "completed_visits")
    @Builder.Default
    private Integer completedVisits = 0;

    @Column(name = "total_distance", precision = 10, scale = 2)
    private BigDecimal totalDistance;

    @Column(name = "start_address", length = 500)
    private String startAddress;

    @Column(name = "start_latitude", precision = 10, scale = 8)
    private BigDecimal startLatitude;

    @Column(name = "start_longitude", precision = 11, scale = 8)
    private BigDecimal startLongitude;

    @Column(name = "end_address", length = 500)
    private String endAddress;

    @Column(name = "end_latitude", precision = 10, scale = 8)
    private BigDecimal endLatitude;

    @Column(name = "end_longitude", precision = 11, scale = 8)
    private BigDecimal endLongitude;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // --- Champs avancés : Objectifs & Résultats ---
    @Column(name = "objective", columnDefinition = "TEXT")
    private String objective;

    @Column(name = "tour_result", columnDefinition = "TEXT")
    private String tourResult;

    // --- Champs avancés : Produits & Commercial ---
    @Column(name = "estimated_revenue", precision = 12, scale = 2)
    private BigDecimal estimatedRevenue;

    @Column(name = "actual_revenue", precision = 12, scale = 2)
    private BigDecimal actualRevenue;

    // --- Champs avancés : Logistique & Dépenses ---
    @Column(name = "vehicle_type", length = 50)
    private String vehicleType;

    @Column(name = "fuel_cost", precision = 10, scale = 2)
    private BigDecimal fuelCost;

    @Column(name = "total_expenses", precision = 12, scale = 2)
    private BigDecimal totalExpenses;

    @Column(name = "start_time")
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    // --- Champs avancés : Suivi & Relance ---
    @Column(name = "follow_up_notes", columnDefinition = "TEXT")
    private String followUpNotes;

    @OneToMany(mappedBy = "tour", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("visitOrder ASC")
    @Builder.Default
    private List<TourVisit> tourVisits = new ArrayList<>();

    @OneToMany(mappedBy = "tour", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    @Builder.Default
    private List<ExpenseReport> expenseReports = new ArrayList<>();

    @CreatedBy
    @Column(name = "created_by_id", updatable = false)
    private UUID createdById;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
