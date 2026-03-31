package com.opticrm.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO allégé pour la galerie des templates (liste paginée).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTemplateListDto {

    private String  id;
    private String  name;
    private String  description;
    private String  category;
    private String  icon;
    private String  entityType;
    private String  triggerType;
    /** Tags séparés par virgule */
    private String  tags;
    private Boolean isSystem;
    private Integer usageCount;
    /** Nombre d'étapes dans ce template */
    private Integer stepCount;
    private Instant createdAt;
}
