package com.opticrm.workflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "workflow_transitions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTransition {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", nullable = false)
    private Workflow workflow;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_step_id", nullable = false)
    private WorkflowStep fromStep;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_step_id", nullable = false)
    private WorkflowStep toStep;

    /** Label for the transition (e.g., "Yes", "No", "Approved", "Rejected") */
    @Column(name = "label", length = 100)
    private String label;

    /** Condition expression for conditional branching (SpEL or simple field check) */
    @Column(name = "condition_expression", columnDefinition = "NVARCHAR(MAX)")
    private String conditionExpression;

    /** Order for evaluating transitions from the same source step */
    @Column(name = "eval_order")
    @Builder.Default
    private Integer evalOrder = 0;
}
