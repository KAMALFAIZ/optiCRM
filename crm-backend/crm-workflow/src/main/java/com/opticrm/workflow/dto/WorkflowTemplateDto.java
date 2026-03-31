package com.opticrm.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * DTO complet d'un template de workflow (détail).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTemplateDto {

    private String id;
    private String name;
    private String description;
    private String category;
    private String icon;
    private String entityType;
    private String triggerType;
    private String triggerConfig;

    /** Étapes parsées (depuis stepsConfig JSON) */
    private List<StepPreview> steps;

    /** Transitions parsées (depuis transitionsConfig JSON) */
    private List<TransitionPreview> transitions;

    /** Tags séparés par virgule */
    private String tags;
    private Boolean isSystem;
    private Integer usageCount;
    private Instant createdAt;
    private Instant updatedAt;

    // ── Sous-classes ─────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StepPreview {
        private String name;
        private String stepType;
        private String actionConfig;
        private Integer stepOrder;
        private Boolean isEntryPoint;
        private Integer positionX;
        private Integer positionY;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransitionPreview {
        private Integer fromStepIndex;
        private Integer toStepIndex;
        private String label;
        private String conditionExpression;
        private Integer evalOrder;
    }
}
