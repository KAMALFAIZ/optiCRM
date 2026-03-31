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
public class WorkflowDto {

    private String id;
    private String name;
    private String description;
    private String entityType;
    private String triggerType;
    private String triggerConfig;
    private Boolean isActive;
    private Integer version;
    private List<WorkflowStepDto> steps;
    private List<WorkflowTransitionDto> transitions;
    private UserInfo createdBy;
    private Instant createdAt;
    private Instant updatedAt;

    // Stats
    private Long totalExecutions;
    private Long activeExecutions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private String id;
        private String firstName;
        private String lastName;
    }
}
