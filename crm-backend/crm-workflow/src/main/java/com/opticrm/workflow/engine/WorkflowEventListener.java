package com.opticrm.workflow.engine;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Listens for entity lifecycle events and triggers matching workflows.
 * Other modules can publish WorkflowTriggerEvent to trigger workflows.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WorkflowEventListener {

    private final WorkflowEngine workflowEngine;

    @EventListener
    public void handleWorkflowTrigger(WorkflowTriggerEvent event) {
        log.debug("Received workflow trigger event: {} {} {}", event.getEntityType(), event.getTriggerType(), event.getEntityId());
        workflowEngine.triggerWorkflows(
                event.getEntityType(),
                event.getEntityId(),
                event.getTriggerType(),
                event.getChangedField(),
                event.getOldValue(),
                event.getNewValue()
        );
    }
}
