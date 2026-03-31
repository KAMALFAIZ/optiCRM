package com.opticrm.core.project.dto;

import com.opticrm.core.project.entity.Project;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDto {
    private UUID id;
    private String reference;
    private String name;
    private String description;
    private Project.ProjectStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal budget;
    private Integer progressPct;

    private RelatedDto account;
    private RelatedDto opportunity;
    private UserSummaryDto manager;
    private UserSummaryDto createdBy;

    private List<MemberDto> members;
    private List<MilestoneDto> milestones;

    private Instant createdAt;
    private Instant updatedAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RelatedDto { private UUID id; private String name; }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserSummaryDto { private UUID id; private String fullName; private String email; }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MemberDto {
        private UUID userId;
        private String fullName;
        private String email;
        private String role;
    }
}
