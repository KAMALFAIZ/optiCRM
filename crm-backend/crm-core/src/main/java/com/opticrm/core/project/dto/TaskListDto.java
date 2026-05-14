package com.opticrm.core.project.dto;

import com.opticrm.core.project.entity.Task;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskListDto {
    private UUID id;
    private String title;
    private Task.TaskStatus status;
    private Task.TaskPriority priority;
    private Task.TaskType type;
    private LocalDate dueDate;
    private BigDecimal estimatedHours;
    private boolean overdue;

    private UUID projectId;
    private String projectName;
    private UUID milestoneId;
    private String milestoneName;
    private UUID assigneeId;
    private String assigneeName;

    private int subTaskCount;
    private int commentCount;
    private Instant createdAt;
}
