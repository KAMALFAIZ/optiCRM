package com.opticrm.core.opportunity.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Corps de la requête PATCH /{id}/stage — déplacement Kanban */
@Data
public class MoveStageRequest {
    @NotBlank(message = "stageId est obligatoire")
    private String stageId;
}
