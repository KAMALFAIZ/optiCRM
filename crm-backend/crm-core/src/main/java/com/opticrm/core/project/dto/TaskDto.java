package com.opticrm.core.project.dto;

import com.opticrm.core.project.entity.Task;
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
public class TaskDto {
    private UUID id;
    private String title;
    private String description;
    private Task.TaskStatus status;
    private Task.TaskPriority priority;
    private Task.TaskType type;
    private BigDecimal estimatedHours;
    private BigDecimal actualHours;
    private LocalDate startDate;
    private LocalDate dueDate;
    private Instant completedAt;

    private UUID projectId;
    private String projectName;
    private UUID milestoneId;
    private String milestoneName;
    private UUID parentTaskId;

    private UserSummaryDto assignee;
    private UserSummaryDto createdBy;

    private List<TaskCommentDto> comments;
    private List<TaskDto> subTasks;

    private Instant createdAt;
    private Instant updatedAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserSummaryDto { private UUID id; private String fullName; private String email; }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TaskCommentDto {
        private UUID id;
        private String content;
        private UUID authorId;
        private String authorName;
        private Instant createdAt;
    }
}
