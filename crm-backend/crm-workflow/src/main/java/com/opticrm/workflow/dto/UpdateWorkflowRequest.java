package com.opticrm.workflow.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWorkflowRequest {

    @Size(max = 200)
    private String name;

    private String description;

    private String entityType;

    private String triggerType;

    private String triggerConfig;

    private Boolean isActive;

    @Valid
    private List<CreateWorkflowRequest.StepRequest> steps;

    @Valid
    private List<CreateWorkflowRequest.TransitionRequest> transitions;
}
