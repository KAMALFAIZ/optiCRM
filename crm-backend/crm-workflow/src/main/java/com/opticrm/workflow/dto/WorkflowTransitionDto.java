package com.opticrm.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTransitionDto {

    private String id;
    private String fromStepId;
    private String toStepId;
    private String label;
    private String conditionExpression;
    private Integer evalOrder;
}
