package com.opticrm.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStepDto {

    private String id;
    private String name;
    private String stepType;
    private String actionConfig;
    private Integer stepOrder;
    private Integer positionX;
    private Integer positionY;
    private Boolean isEntryPoint;
}
