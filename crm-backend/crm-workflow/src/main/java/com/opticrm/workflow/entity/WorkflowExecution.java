package com.opticrm.workflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "workflow_executions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class WorkflowExecution {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", nullable = false)
    private Workflow workflow;

    /** The entity type being processed (LEAD, OPPORTUNITY, etc.) */
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    /** The ID of the entity instance that triggered this execution */
    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    /** RUNNING, COMPLETED, FAILED, PAUSED (waiting for delay/approval), CANCELLED */
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "RUNNING";

    /** The step currently being executed or waiting */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_step_id")
    private WorkflowStep currentStep;

    /** When execution should resume (for DELAY steps) */
    @Column(name = "resume_at")
    private Instant resumeAt;

    @Column(name = "error_message", columnDefinition = "NVARCHAR(MAX)")
    private String errorMessage;

    /** Who triggered this execution (null for auto-triggered) */
    @Column(name = "triggered_by_id")
    private UUID triggeredById;

    @OneToMany(mappedBy = "execution", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("executedAt ASC")
    @Builder.Default
    private List<WorkflowExecutionLog> logs = new ArrayList<>();

    @CreatedDate
    @Column(name = "started_at", nullable = false, updatable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;
}
