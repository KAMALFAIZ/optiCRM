package com.opticrm.workflow.entity;

import com.opticrm.security.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "workflows")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Workflow {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    /** Entity type this workflow applies to: LEAD, OPPORTUNITY, ACCOUNT, CONTACT, QUOTE, VISIT, TICKET */
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    /** Trigger type: ENTITY_CREATED, FIELD_CHANGED, STATUS_CHANGED, SCORE_REACHED, CRON, MANUAL */
    @Column(name = "trigger_type", nullable = false, length = 50)
    private String triggerType;

    /** JSON config for trigger (field name, old/new values, cron expression, score threshold, etc.) */
    @Column(name = "trigger_config", columnDefinition = "NVARCHAR(MAX)")
    private String triggerConfig;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = false;

    @Column(name = "version")
    @Builder.Default
    private Integer version = 1;

    @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("stepOrder ASC")
    @Builder.Default
    private List<WorkflowStep> steps = new ArrayList<>();

    @OneToMany(mappedBy = "workflow", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<WorkflowTransition> transitions = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", updatable = false)
    private User createdBy;

    @CreatedBy
    @Column(name = "created_by_user_id", updatable = false)
    private UUID createdByUserId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
