package com.opticrm.core.objection.dto;

import com.opticrm.core.objection.entity.Objection;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateObjectionRequest {

    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 200, message = "Le titre ne doit pas dépasser 200 caractères")
    private String title;

    private String description;

    private Objection.ObjectionCategory category;

    private String response;

    private UUID contactId;

    private UUID accountId;

    private UUID opportunityId;

    private Objection.ObjectionStatus status;

    private Objection.ObjectionPriority priority;

    private Objection.ObjectionSource source;

    private UUID assignedToId;
}
