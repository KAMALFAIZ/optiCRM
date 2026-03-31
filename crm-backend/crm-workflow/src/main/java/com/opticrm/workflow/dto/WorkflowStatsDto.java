package com.opticrm.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStatsDto {

    private long totalWorkflows;
    private long activeWorkflows;
    private long totalExecutions;
    private long runningExecutions;
    private long completedExecutions;
    private long failedExecutions;
    private long pausedExecutions;
}
