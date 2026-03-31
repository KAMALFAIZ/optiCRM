package com.opticrm.core.objectives.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "commercial_objectives",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"user_id", "product_id", "period_year", "period_month"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class CommercialObjective {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "period_year", nullable = false)
    private Integer periodYear;

    /** Mois 1-12. NULL = objectif annuel. */
    @Column(name = "period_month")
    private Integer periodMonth;

    @Column(name = "target_qty", nullable = false, precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal targetQty = BigDecimal.ZERO;

    /** CA objectif en MAD */
    @Column(name = "target_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal targetAmount = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
