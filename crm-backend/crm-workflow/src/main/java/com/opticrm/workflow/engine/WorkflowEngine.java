package com.opticrm.workflow.engine;

import com.opticrm.workflow.entity.*;
import com.opticrm.workflow.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowEngine {

    private final WorkflowRepository workflowRepository;
    private final WorkflowStepRepository stepRepository;
    private final WorkflowTransitionRepository transitionRepository;
    private final WorkflowExecutionRepository executionRepository;
    private final WorkflowExecutionLogRepository logRepository;
    private final WorkflowActionExecutor actionExecutor;
    private final WorkflowConditionEvaluator conditionEvaluator;

    /**
     * Trigger all matching workflows for a given entity event.
     */
    @Async
    public void triggerWorkflows(String entityType, UUID entityId, String triggerType, String changedField, String oldValue, String newValue) {
        List<Workflow> workflows = workflowRepository.findByEntityTypeAndIsActiveTrue(entityType);

        for (Workflow wf : workflows) {
            if (!wf.getTriggerType().equals(triggerType)) continue;
            if (!matchesTriggerConfig(wf, changedField, oldValue, newValue)) continue;

            log.info("Triggering workflow '{}' for {} {}", wf.getName(), entityType, entityId);
            startExecution(wf, entityType, entityId, null);
        }
    }

    /**
     * Manually start a workflow execution.
     */
    @Transactional
    public WorkflowExecution startExecution(Workflow workflow, String entityType, UUID entityId, UUID triggeredById) {
        WorkflowStep entryStep = stepRepository.findByWorkflowIdAndIsEntryPointTrue(workflow.getId())
                .orElse(null);

        if (entryStep == null) {
            List<WorkflowStep> steps = stepRepository.findByWorkflowIdOrderByStepOrderAsc(workflow.getId());
            if (steps.isEmpty()) {
                log.warn("Workflow '{}' has no steps, cannot execute", workflow.getName());
                return null;
            }
            entryStep = steps.get(0);
        }

        WorkflowExecution execution = WorkflowExecution.builder()
                .workflow(workflow)
                .entityType(entityType)
                .entityId(entityId)
                .status("RUNNING")
                .currentStep(entryStep)
                .triggeredById(triggeredById)
                .build();
        executionRepository.save(execution);

        log.info("Execution {} started for workflow '{}'", execution.getId(), workflow.getName());
        executeStep(execution, entryStep);
        return execution;
    }

    /**
     * Execute a single step and advance to the next.
     */
    @Transactional
    public void executeStep(WorkflowExecution execution, WorkflowStep step) {
        long startTime = System.currentTimeMillis();

        WorkflowExecutionLog logEntry = WorkflowExecutionLog.builder()
                .execution(execution)
                .step(step)
                .status("STARTED")
                .build();
        logRepository.save(logEntry);

        try {
            String stepType = step.getStepType();

            // Handle DELAY steps
            if ("DELAY".equals(stepType)) {
                long delayMs = actionExecutor.parseDelayMs(step.getActionConfig());
                execution.setStatus("PAUSED");
                execution.setResumeAt(Instant.now().plusMillis(delayMs));
                execution.setCurrentStep(step);
                executionRepository.save(execution);

                logEntry.setStatus("COMPLETED");
                logEntry.setOutputData("{\"action\":\"paused\",\"resumeAt\":\"" + execution.getResumeAt() + "\"}");
                logEntry.setDurationMs(System.currentTimeMillis() - startTime);
                logRepository.save(logEntry);
                return;
            }

            // Handle CONDITION steps
            if ("CONDITION".equals(stepType)) {
                boolean result = conditionEvaluator.evaluate(step.getActionConfig(), execution.getEntityType(), execution.getEntityId());

                logEntry.setStatus("COMPLETED");
                logEntry.setOutputData("{\"conditionResult\":" + result + "}");
                logEntry.setDurationMs(System.currentTimeMillis() - startTime);
                logRepository.save(logEntry);

                // Follow the appropriate transition
                advanceConditional(execution, step, result);
                return;
            }

            // Handle APPROVAL steps
            if ("APPROVAL".equals(stepType)) {
                execution.setStatus("PAUSED");
                execution.setCurrentStep(step);
                executionRepository.save(execution);

                actionExecutor.executeApprovalRequest(step, execution);

                logEntry.setStatus("COMPLETED");
                logEntry.setOutputData("{\"action\":\"approval_requested\"}");
                logEntry.setDurationMs(System.currentTimeMillis() - startTime);
                logRepository.save(logEntry);
                return;
            }

            // Execute action steps
            String output = actionExecutor.execute(step, execution);

            logEntry.setStatus("COMPLETED");
            logEntry.setOutputData(output);
            logEntry.setDurationMs(System.currentTimeMillis() - startTime);
            logRepository.save(logEntry);

            // Advance to next step
            advance(execution, step);

        } catch (Exception e) {
            log.error("Step execution failed: {} in workflow execution {}", step.getName(), execution.getId(), e);
            logEntry.setStatus("FAILED");
            logEntry.setErrorMessage(e.getMessage());
            logEntry.setDurationMs(System.currentTimeMillis() - startTime);
            logRepository.save(logEntry);

            execution.setStatus("FAILED");
            execution.setErrorMessage("Step '" + step.getName() + "' failed: " + e.getMessage());
            execution.setCompletedAt(Instant.now());
            executionRepository.save(execution);
        }
    }

    /**
     * Resume a paused execution (after delay or approval).
     */
    @Transactional
    public void resumeExecution(WorkflowExecution execution) {
        if (!"PAUSED".equals(execution.getStatus())) return;

        execution.setStatus("RUNNING");
        executionRepository.save(execution);

        WorkflowStep currentStep = execution.getCurrentStep();
        advance(execution, currentStep);
    }

    /**
     * Handle approval response.
     */
    @Transactional
    public void handleApproval(UUID executionId, boolean approved) {
        WorkflowExecution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new IllegalArgumentException("Execution not found: " + executionId));

        if (!"PAUSED".equals(execution.getStatus())) return;

        WorkflowStep currentStep = execution.getCurrentStep();
        execution.setStatus("RUNNING");
        executionRepository.save(execution);

        advanceConditional(execution, currentStep, approved);
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    private void advance(WorkflowExecution execution, WorkflowStep fromStep) {
        List<WorkflowTransition> transitions = transitionRepository.findByFromStepIdOrderByEvalOrderAsc(fromStep.getId());

        if (transitions.isEmpty()) {
            // End of workflow
            execution.setStatus("COMPLETED");
            execution.setCompletedAt(Instant.now());
            execution.setCurrentStep(null);
            executionRepository.save(execution);
            log.info("Execution {} completed", execution.getId());
            return;
        }

        // Follow first transition (non-conditional advance)
        WorkflowTransition next = transitions.get(0);
        execution.setCurrentStep(next.getToStep());
        executionRepository.save(execution);
        executeStep(execution, next.getToStep());
    }

    private void advanceConditional(WorkflowExecution execution, WorkflowStep fromStep, boolean conditionResult) {
        List<WorkflowTransition> transitions = transitionRepository.findByFromStepIdOrderByEvalOrderAsc(fromStep.getId());

        for (WorkflowTransition t : transitions) {
            String label = t.getLabel();
            boolean match = false;

            if (conditionResult && ("Yes".equalsIgnoreCase(label) || "true".equalsIgnoreCase(label) || "Approved".equalsIgnoreCase(label) || "Oui".equalsIgnoreCase(label))) {
                match = true;
            } else if (!conditionResult && ("No".equalsIgnoreCase(label) || "false".equalsIgnoreCase(label) || "Rejected".equalsIgnoreCase(label) || "Non".equalsIgnoreCase(label))) {
                match = true;
            }

            if (match) {
                execution.setCurrentStep(t.getToStep());
                executionRepository.save(execution);
                executeStep(execution, t.getToStep());
                return;
            }
        }

        // No matching transition, end workflow
        execution.setStatus("COMPLETED");
        execution.setCompletedAt(Instant.now());
        executionRepository.save(execution);
        log.info("Execution {} completed (no matching transition from condition)", execution.getId());
    }

    private boolean matchesTriggerConfig(Workflow wf, String changedField, String oldValue, String newValue) {
        String config = wf.getTriggerConfig();
        if (config == null || config.isBlank()) return true;

        // Simple JSON parsing for trigger matching
        if (config.contains("\"field\"")) {
            if (changedField == null) return false;
            return config.contains("\"" + changedField + "\"");
        }

        if (config.contains("\"newValue\"") && newValue != null) {
            return config.contains("\"" + newValue + "\"");
        }

        return true;
    }
}
