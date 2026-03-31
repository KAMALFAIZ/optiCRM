package com.opticrm.core.opportunity.entity;

import com.opticrm.core.account.entity.Account;
import com.opticrm.core.contact.entity.Contact;
import com.opticrm.core.lead.entity.Lead;
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
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "opportunities")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Opportunity {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "amount", precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "MAD";

    @Column(name = "probability")
    @Builder.Default
    private Integer probability = 0;

    // Weighted amount is calculated in DB
    @Column(name = "weighted_amount", insertable = false, updatable = false)
    private BigDecimal weightedAmount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_id", nullable = false)
    private OpportunityStage stage;

    @Column(name = "stage_changed_at")
    private Instant stageChangedAt;

    @Column(name = "close_date")
    private LocalDate closeDate;

    @Column(name = "actual_close_date")
    private LocalDate actualCloseDate;

    @Column(name = "type", length = 50)
    private String type;

    @Column(name = "lead_source", length = 50)
    private String leadSource;

    // Relations
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_contact_id")
    private Contact primaryContact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id")
    private Lead lead;

    @Column(name = "campaign_id")
    private UUID campaignId;

    // Status
    @Column(name = "is_won")
    private Boolean isWon;

    @Column(name = "is_closed")
    @Builder.Default
    private Boolean isClosed = false;

    @Column(name = "close_reason", length = 100)
    private String closeReason;

    @Column(name = "competitor_id")
    private UUID competitorId;

    // Champs avancés pipeline (V25)
    @Column(name = "forecast_category", length = 20)
    private String forecastCategory; // COMMIT, BEST_CASE, PIPELINE

    @Column(name = "next_followup_date")
    private LocalDate nextFollowupDate;

    @Column(name = "competitor_name", length = 100)
    private String competitorName;

    @Column(name = "lost_reason_detail", columnDefinition = "TEXT")
    private String lostReasonDetail;

    // Details
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "next_step", columnDefinition = "TEXT")
    private String nextStep;

    @Column(name = "tags", columnDefinition = "TEXT[]")
    private List<String> tags;

    // Optimistic locking
    @Version
    @Column(name = "version")
    private Long version;

    // Audit
    @CreatedBy
    @Column(name = "created_by_id", updatable = false)
    private UUID createdById;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    // Helpers
    public BigDecimal getWeightedAmountCalculated() {
        if (amount == null || probability == null) return BigDecimal.ZERO;
        return amount.multiply(BigDecimal.valueOf(probability)).divide(BigDecimal.valueOf(100));
    }
}
