package com.opticrm.core.project.service;

import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.project.dto.*;
import com.opticrm.core.project.entity.*;
import com.opticrm.core.project.repository.*;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.UserRepository;
import com.opticrm.security.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final UserRepository userRepository;
    private final SecurityService securityService;
    private final ProjectService projectService;

    // ── Lecture ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<TaskListDto> findAll(UUID projectId, Task.TaskStatus status, UUID assigneeId, Pageable pageable) {
        return taskRepository.findWithFilters(projectId, status, assigneeId, pageable).map(this::toListDto);
    }

    @Transactional(readOnly = true)
    public TaskDto findById(UUID id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée"));
        return toDto(task, true);
    }

    @Transactional(readOnly = true)
    public List<TaskListDto> getMyTasks() {
        User currentUser = securityService.getCurrentUser();
        return taskRepository.findActiveByAssignee(currentUser.getId(),
                        List.of(Task.TaskStatus.FAIT, Task.TaskStatus.ANNULE))
                .stream().map(this::toListDto).toList();
    }

    @Transactional(readOnly = true)
    public List<TaskListDto> getTasksByProject(UUID projectId) {
        return taskRepository.findByProjectIdAndParentTaskIsNullOrderByCreatedAtAsc(projectId)
                .stream().map(this::toListDto).toList();
    }

    // ── Écriture ───────────────────────────────────────────────────────────

    public TaskDto create(CreateTaskRequest req) {
        User currentUser = securityService.getCurrentUser();
        Project project = projectRepository.findById(req.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));

        Task task = Task.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .project(project)
                .priority(req.getPriority() != null ? req.getPriority() : Task.TaskPriority.NORMALE)
                .type(req.getType() != null ? req.getType() : Task.TaskType.TACHE)
                .estimatedHours(req.getEstimatedHours())
                .startDate(req.getStartDate())
                .dueDate(req.getDueDate())
                .createdBy(currentUser)
                .build();

        if (req.getMilestoneId() != null) {
            task.setMilestone(milestoneRepository.findById(req.getMilestoneId())
                    .orElseThrow(() -> new ResourceNotFoundException("Milestone non trouvé")));
        }
        if (req.getParentTaskId() != null) {
            task.setParentTask(taskRepository.findById(req.getParentTaskId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tâche parente non trouvée")));
        }
        if (req.getAssigneeId() != null) {
            task.setAssignee(userRepository.findById(req.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé")));
        }

        task = taskRepository.save(task);
        projectService.recalculateProgress(project.getId());
        return toDto(task, false);
    }

    public TaskDto update(UUID id, UpdateTaskRequest req) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée"));

        task.setTitle(req.getTitle());
        task.setDescription(req.getDescription());
        if (req.getPriority() != null) task.setPriority(req.getPriority());
        if (req.getType() != null) task.setType(req.getType());
        task.setEstimatedHours(req.getEstimatedHours());
        task.setActualHours(req.getActualHours());
        task.setStartDate(req.getStartDate());
        task.setDueDate(req.getDueDate());

        if (req.getStatus() != null) applyStatusTransition(task, req.getStatus());

        task.setMilestone(req.getMilestoneId() != null
                ? milestoneRepository.findById(req.getMilestoneId())
                        .orElseThrow(() -> new ResourceNotFoundException("Milestone non trouvé"))
                : null);
        task.setAssignee(req.getAssigneeId() != null
                ? userRepository.findById(req.getAssigneeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"))
                : null);

        task = taskRepository.save(task);
        projectService.recalculateProgress(task.getProject().getId());
        return toDto(task, false);
    }

    public TaskDto changeStatus(UUID id, Task.TaskStatus newStatus) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée"));
        applyStatusTransition(task, newStatus);
        task = taskRepository.save(task);
        projectService.recalculateProgress(task.getProject().getId());
        return toDto(task, false);
    }

    public void delete(UUID id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée"));
        UUID projectId = task.getProject().getId();
        taskRepository.delete(task);
        projectService.recalculateProgress(projectId);
    }

    // ── Commentaires ───────────────────────────────────────────────────────

    public TaskDto.TaskCommentDto addComment(UUID taskId, AddTaskCommentRequest req) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée"));
        User currentUser = securityService.getCurrentUser();

        TaskComment comment = TaskComment.builder()
                .task(task)
                .content(req.getContent())
                .author(currentUser)
                .build();
        comment = taskCommentRepository.save(comment);

        return TaskDto.TaskCommentDto.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .authorId(currentUser.getId())
                .authorName(currentUser.getFullName())
                .createdAt(comment.getCreatedAt())
                .build();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private void applyStatusTransition(Task task, Task.TaskStatus newStatus) {
        task.setStatus(newStatus);
        if (newStatus == Task.TaskStatus.FAIT && task.getCompletedAt() == null) {
            task.setCompletedAt(Instant.now());
        }
        if (newStatus != Task.TaskStatus.FAIT) {
            task.setCompletedAt(null);
        }
    }

    private boolean isOverdue(Task t) {
        return t.getDueDate() != null
                && LocalDate.now().isAfter(t.getDueDate())
                && t.getStatus() != Task.TaskStatus.FAIT
                && t.getStatus() != Task.TaskStatus.ANNULE;
    }

    private TaskDto toDto(Task t, boolean withDetails) {
        List<TaskDto.TaskCommentDto> comments = withDetails
                ? taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(t.getId()).stream()
                        .map(c -> TaskDto.TaskCommentDto.builder()
                                .id(c.getId()).content(c.getContent())
                                .authorId(c.getAuthor() != null ? c.getAuthor().getId() : null)
                                .authorName(c.getAuthor() != null ? c.getAuthor().getFullName() : null)
                                .createdAt(c.getCreatedAt()).build())
                        .toList()
                : List.of();

        List<TaskDto> subTasks = withDetails
                ? t.getSubTasks().stream().map(s -> toDto(s, false)).toList()
                : List.of();

        return TaskDto.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .status(t.getStatus())
                .priority(t.getPriority())
                .type(t.getType())
                .estimatedHours(t.getEstimatedHours())
                .actualHours(t.getActualHours())
                .startDate(t.getStartDate())
                .dueDate(t.getDueDate())
                .completedAt(t.getCompletedAt())
                .projectId(t.getProject().getId())
                .projectName(t.getProject().getName())
                .milestoneId(t.getMilestone() != null ? t.getMilestone().getId() : null)
                .milestoneName(t.getMilestone() != null ? t.getMilestone().getName() : null)
                .parentTaskId(t.getParentTask() != null ? t.getParentTask().getId() : null)
                .assignee(t.getAssignee() != null ? TaskDto.UserSummaryDto.builder()
                        .id(t.getAssignee().getId())
                        .fullName(t.getAssignee().getFullName())
                        .email(t.getAssignee().getEmail()).build() : null)
                .createdBy(t.getCreatedBy() != null ? TaskDto.UserSummaryDto.builder()
                        .id(t.getCreatedBy().getId())
                        .fullName(t.getCreatedBy().getFullName())
                        .email(t.getCreatedBy().getEmail()).build() : null)
                .comments(comments)
                .subTasks(subTasks)
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    private TaskListDto toListDto(Task t) {
        return TaskListDto.builder()
                .id(t.getId())
                .title(t.getTitle())
                .status(t.getStatus())
                .priority(t.getPriority())
                .type(t.getType())
                .dueDate(t.getDueDate())
                .estimatedHours(t.getEstimatedHours())
                .overdue(isOverdue(t))
                .projectId(t.getProject().getId())
                .projectName(t.getProject().getName())
                .milestoneId(t.getMilestone() != null ? t.getMilestone().getId() : null)
                .milestoneName(t.getMilestone() != null ? t.getMilestone().getName() : null)
                .assigneeId(t.getAssignee() != null ? t.getAssignee().getId() : null)
                .assigneeName(t.getAssignee() != null ? t.getAssignee().getFullName() : null)
                .subTaskCount(taskRepository.countByParentTaskId(t.getId()))
                .commentCount(taskCommentRepository.countByTaskId(t.getId()))
                .createdAt(t.getCreatedAt())
                .build();
    }
}
