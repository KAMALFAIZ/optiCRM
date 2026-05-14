package com.opticrm.core.project.dto;

import com.opticrm.core.project.entity.Project;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProjectRequest {

    @NotBlank(message = "Le nom du projet est obligatoire")
    @Size(max = 300)
    private String name;

    private String description;
    private Project.ProjectStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal budget;
    private UUID accountId;
    private UUID opportunityId;
    private UUID managerId;
}
