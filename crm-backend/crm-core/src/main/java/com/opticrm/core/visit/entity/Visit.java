package com.opticrm.core.visit.entity;

import com.opticrm.core.account.entity.Account;
import com.opticrm.core.chantier.entity.Chantier;
import com.opticrm.core.contact.entity.Contact;
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
@Table(name = "visits")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Visit {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id")
    private Contact contact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    // Lien optionnel vers un Chantier (alternatif ou complémentaire à account)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chantier_id")
    private Chantier chantier;

    @Column(name = "visit_type", nullable = false, length = 50)
    private String visitType;

    @Column(name = "subject", nullable = false, length = 255)
    private String subject;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "visit_date", nullable = false)
    private Instant visitDate;

    @Column(name = "visit_end_date")
    private Instant visitEndDate;

    @Column(name = "duration")
    private Integer duration;

    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "planned";

    @Column(name = "latitude", precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "check_in_at")
    private Instant checkInAt;

    @Column(name = "check_out_at")
    private Instant checkOutAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "outcome", length = 50)
    private String outcome;

    @Column(name = "next_action", columnDefinition = "TEXT")
    private String nextAction;

    // --- Champs avancés : Objectifs & Résultats ---
    @Column(name = "objective", length = 255)
    private String objective;

    @Column(name = "interest_level", length = 20)
    private String interestLevel;

    @Column(name = "satisfaction")
    private Integer satisfaction;

    @Column(name = "competitor_detected", length = 255)
    private String competitorDetected;

    // --- Champs avancés : Produits & Commercial ---
    @Column(name = "products_presented", columnDefinition = "TEXT")
    private String productsPresented;

    @Column(name = "estimated_amount", precision = 12, scale = 2)
    private BigDecimal estimatedAmount;

    @Column(name = "samples_delivered", length = 255)
    private String samplesDelivered;

    // --- Champs avancés : Logistique & Dépenses ---
    @Column(name = "transport_mode", length = 50)
    private String transportMode;

    @Column(name = "mileage", precision = 10, scale = 2)
    private BigDecimal mileage;

    @Column(name = "expenses", precision = 12, scale = 2)
    private BigDecimal expenses;

    // --- Champs avancés : Suivi & Relance ---
    @Column(name = "follow_up_date")
    private Instant followUpDate;

    @Column(name = "follow_up_priority", length = 20)
    private String followUpPriority;

    @Column(name = "next_visit_planned")
    private Boolean nextVisitPlanned;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

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
