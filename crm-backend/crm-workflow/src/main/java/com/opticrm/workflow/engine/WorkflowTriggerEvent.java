package com.opticrm.workflow.engine;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Event published by other modules to trigger workflows.
 *
 * Usage from any service:
 *   applicationEventPublisher.publishEvent(WorkflowTriggerEvent.builder()
 *       .entityType("LEAD")
 *       .entityId(lead.getId())
 *       .triggerType("ENTITY_CREATED")
 *       .build());
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTriggerEvent {

    private String entityType;
    private UUID entityId;

    /** ENTITY_CREATED, FIELD_CHANGED, STATUS_CHANGED, SCORE_REACHED */
    private String triggerType;

    /** For FIELD_CHANGED triggers */
    private String changedField;
    private String oldValue;
    private String newValue;
}
