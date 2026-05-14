package com.opticrm.workflow.engine;

import com.opticrm.workflow.entity.Workflow;
import com.opticrm.workflow.entity.WorkflowExecution;
import com.opticrm.workflow.repository.WorkflowExecutionRepository;
import com.opticrm.workflow.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WorkflowScheduler {

    private final WorkflowRepository workflowRepository;
    private final WorkflowExecutionRepository executionRepository;
    private final WorkflowEngine workflowEngine;

    /**
     * Resume paused executions whose delay has expired.
     * Runs every 30 seconds.
     */
    @Scheduled(fixedDelay = 30000)
    public void resumePausedExecutions() {
        List<WorkflowExecution> paused = executionRepository.findPausedExecutionsReadyToResume(Instant.now());
        for (WorkflowExecution exec : paused) {
            try {
                log.info("Resuming paused execution: {}", exec.getId());
                workflowEngine.resumeExecution(exec);
            } catch (Exception e) {
                log.error("Failed to resume execution {}: {}", exec.getId(), e.getMessage());
            }
        }
    }

    /**
     * Execute CRON-triggered workflows.
     * Runs every minute to check for cron-based triggers.
     * In a production system, this would use a proper cron expression parser.
     */
    @Scheduled(fixedDelay = 60000)
    public void executeCronWorkflows() {
        List<Workflow> cronWorkflows = workflowRepository.findActiveCronWorkflows();
        for (Workflow wf : cronWorkflows) {
            try {
                if (shouldExecuteCron(wf)) {
                    log.info("Executing CRON workflow: {}", wf.getName());
                    // For CRON workflows, entityId is null (operates on a query/batch)
                    // The action steps should handle batch logic via their config
                    workflowEngine.startExecution(wf, wf.getEntityType(), null, null);
                }
            } catch (Exception e) {
                log.error("Failed to execute CRON workflow {}: {}", wf.getName(), e.getMessage());
            }
        }
    }

    private boolean shouldExecuteCron(Workflow wf) {
        // Simplified cron check - in production, use a library like cron-utils
        // For now, trigger config contains: {"cronExpression": "0 9 * * 1-5", "lastExecutedAt": "..."}
        // This is a placeholder for proper cron evaluation
        return false; // Disabled by default, will be enabled with proper cron parsing
    }
}
