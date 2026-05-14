package com.opticrm.workflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "workflow_steps")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStep {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", nullable = false)
    private Workflow workflow;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    /**
     * Step type:
     * SEND_EMAIL, CREATE_TASK, CREATE_ACTIVITY, UPDATE_ENTITY,
     * SEND_NOTIFICATION, DELAY, CONDITION, APPROVAL, AI_ACTION, WEBHOOK
     */
    @Column(name = "step_type", nullable = false, length = 50)
    private String stepType;

    /** JSON configuration for the step action (template id, field values, delay duration, condition expression, etc.) */
    @Column(name = "action_config", columnDefinition = "NVARCHAR(MAX)")
    private String actionConfig;

    /** Order of this step in the workflow (for linear flows) */
    @Column(name = "step_order", nullable = false)
    @Builder.Default
    private Integer stepOrder = 0;

    /** Visual position X for the editor canvas */
    @Column(name = "position_x")
    @Builder.Default
    private Integer positionX = 0;

    /** Visual position Y for the editor canvas */
    @Column(name = "position_y")
    @Builder.Default
    private Integer positionY = 0;

    /** Whether this is the entry point of the workflow */
    @Column(name = "is_entry_point")
    @Builder.Default
    private Boolean isEntryPoint = false;
}
