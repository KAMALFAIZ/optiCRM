package com.opticrm.core.project.dto;

import com.opticrm.core.project.entity.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTaskRequest {

    @NotBlank(message = "Le titre de la tâche est obligatoire")
    @Size(max = 300)
    private String title;

    private String description;

    @NotNull(message = "Le projet est obligatoire")
    private UUID projectId;

    private UUID milestoneId;
    private UUID parentTaskId;
    private UUID assigneeId;

    private Task.TaskPriority priority = Task.TaskPriority.NORMALE;
    private Task.TaskType type = Task.TaskType.TACHE;

    private BigDecimal estimatedHours;
    private LocalDate startDate;
    private LocalDate dueDate;
}
