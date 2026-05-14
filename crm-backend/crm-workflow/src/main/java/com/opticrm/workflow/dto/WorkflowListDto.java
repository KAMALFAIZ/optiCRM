package com.opticrm.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowListDto {

    private String id;
    private String name;
    private String entityType;
    private String triggerType;
    private Boolean isActive;
    private Integer version;
    private Integer stepCount;
    private Long totalExecutions;
    private Long activeExecutions;
    private String createdByName;
    private Instant createdAt;
    private Instant updatedAt;
}
