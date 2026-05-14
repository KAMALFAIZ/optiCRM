package com.opticrm.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowExecutionDto {

    private String id;
    private String workflowId;
    private String workflowName;
    private String entityType;
    private String entityId;
    private String status;
    private String currentStepId;
    private String currentStepName;
    private Instant resumeAt;
    private String errorMessage;
    private String triggeredById;
    private Instant startedAt;
    private Instant completedAt;
    private List<ExecutionLogDto> logs;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExecutionLogDto {
        private String id;
        private String stepId;
        private String stepName;
        private String stepType;
        private String status;
        private String inputData;
        private String outputData;
        private String errorMessage;
        private Long durationMs;
        private Instant executedAt;
    }
}
