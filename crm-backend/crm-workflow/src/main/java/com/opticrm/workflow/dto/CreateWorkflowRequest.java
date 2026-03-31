package com.opticrm.workflow.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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
public class CreateWorkflowRequest {

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 200)
    private String name;

    private String description;

    @NotBlank(message = "Le type d'entité est obligatoire")
    private String entityType;

    @NotBlank(message = "Le type de déclencheur est obligatoire")
    private String triggerType;

    private String triggerConfig;

    @Valid
    private List<StepRequest> steps;

    @Valid
    private List<TransitionRequest> transitions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StepRequest {
        @NotBlank
        private String name;
        @NotBlank
        private String stepType;
        private String actionConfig;
        private Integer stepOrder;
        private Integer positionX;
        private Integer positionY;
        private Boolean isEntryPoint;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransitionRequest {
        private Integer fromStepIndex;
        private Integer toStepIndex;
        private String fromStepId;
        private String toStepId;
        private String label;
        private String conditionExpression;
        private Integer evalOrder;
    }
}
