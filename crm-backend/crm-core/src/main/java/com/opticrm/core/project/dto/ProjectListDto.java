package com.opticrm.core.project.dto;

import com.opticrm.core.project.entity.Project;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectListDto {
    private UUID id;
    private String reference;
    private String name;
    private Project.ProjectStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer progressPct;
    private BigDecimal budget;
    private UUID accountId;
    private String accountName;
    private UUID managerId;
    private String managerName;
    private int taskCount;
    private int memberCount;
    private Instant createdAt;
}
