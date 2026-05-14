package com.opticrm.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupervisorAssignmentDto {

    private UUID id;
    private UUID supervisorId;
    private String supervisorName;
    private UUID collaboratorId;
    private String collaboratorName;
    private String collaboratorEmail;
    private String collaboratorRole;
    private Instant assignedAt;
    private String notes;
    private boolean active;
}
