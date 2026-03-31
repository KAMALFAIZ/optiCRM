package com.opticrm.core.activity.entity;

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
import java.util.UUID;

@Entity
@Table(name = "activities")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Activity {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "activity_type", nullable = false, length = 50)
    private String activityType;

    @Column(name = "subject", nullable = false, length = 255)
    private String subject;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date")
    private Instant startDate;

    @Column(name = "end_date")
    private Instant endDate;

    @Column(name = "due_date")
    private Instant dueDate;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "duration")
    private Integer duration;

    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "location_type", length = 50)
    private String locationType;

    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "planned";

    @Column(name = "priority", length = 20)
    @Builder.Default
    private String priority = "normal";

    @Column(name = "related_to_type", length = 50)
    private String relatedToType;

    @Column(name = "related_to_id")
    private UUID relatedToId;

    @Column(name = "call_direction", length = 20)
    private String callDirection;

    @Column(name = "call_result", length = 50)
    private String callResult;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @Column(name = "is_recurring")
    @Builder.Default
    private Boolean isRecurring = false;

    @Column(name = "recurrence_rule", columnDefinition = "TEXT")
    private String recurrenceRule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_activity_id")
    private Activity parentActivity;

    @Column(name = "reminder_at")
    private Instant reminderAt;

    @Column(name = "reminder_sent")
    @Builder.Default
    private Boolean reminderSent = false;

    // --- Champs avancés : Objectifs & Résultats ---
    @Column(name = "objective", length = 255)
    private String objective;

    @Column(name = "result", columnDefinition = "TEXT")
    private String result;

    // --- Champs avancés : Produits & Commercial ---
    @Column(name = "products_discussed", columnDefinition = "TEXT")
    private String productsDiscussed;

    @Column(name = "estimated_revenue", precision = 12, scale = 2)
    private BigDecimal estimatedRevenue;

    // --- Champs avancés : Logistique & Dépenses ---
    @Column(name = "expenses", precision = 12, scale = 2)
    private BigDecimal expenses;

    @Column(name = "transport_mode", length = 50)
    private String transportMode;

    @Column(name = "mileage", precision = 10, scale = 2)
    private BigDecimal mileage;

    // --- Champs avancés : Suivi & Relance ---
    @Column(name = "follow_up_date")
    private Instant followUpDate;

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
