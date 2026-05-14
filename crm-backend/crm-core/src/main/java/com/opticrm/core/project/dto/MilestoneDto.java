package com.opticrm.core.project.dto;

import com.opticrm.core.project.entity.Milestone;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneDto {
    private UUID id;
    private String name;
    private String description;
    private LocalDate dueDate;
    private Milestone.MilestoneStatus status;
    private Integer sortOrder;
    private int taskCount;
}
