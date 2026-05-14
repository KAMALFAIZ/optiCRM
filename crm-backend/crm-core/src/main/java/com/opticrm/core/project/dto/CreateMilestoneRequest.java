package com.opticrm.core.project.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateMilestoneRequest {

    @NotBlank(message = "Le nom du milestone est obligatoire")
    private String name;

    private String description;
    private LocalDate dueDate;
    private Integer sortOrder;
}
