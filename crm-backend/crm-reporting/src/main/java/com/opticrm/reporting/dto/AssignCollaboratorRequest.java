package com.opticrm.reporting.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignCollaboratorRequest {

    @NotNull(message = "collaboratorId est obligatoire")
    private UUID collaboratorId;

    private String notes;
}
