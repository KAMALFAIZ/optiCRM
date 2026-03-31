package com.opticrm.core.project.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageResponse;
import com.opticrm.core.project.dto.*;
import com.opticrm.core.project.entity.Task;
import com.opticrm.core.project.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
@Tag(name = "Tâches", description = "API de gestion des tâches")
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    @Operation(summary = "Liste des tâches")
    public ResponseEntity<ApiResponse<PageResponse<TaskListDto>>> getAll(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) Task.TaskStatus status,
            @RequestParam(required = false) UUID assigneeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "dueDate") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<TaskListDto> result = taskService.findAll(projectId, status, assigneeId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/my-tasks")
    @Operation(summary = "Mes tâches actives")
    public ResponseEntity<ApiResponse<List<TaskListDto>>> getMyTasks() {
        return ResponseEntity.ok(ApiResponse.success(taskService.getMyTasks()));
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Tâches d'un projet (vue Kanban)")
    public ResponseEntity<ApiResponse<List<TaskListDto>>> getByProject(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTasksByProject(projectId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'une tâche")
    public ResponseEntity<ApiResponse<TaskDto>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(taskService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "Créer une tâche")
    public ResponseEntity<ApiResponse<TaskDto>> create(@Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(taskService.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier une tâche")
    public ResponseEntity<ApiResponse<TaskDto>> update(
            @PathVariable UUID id, @Valid @RequestBody UpdateTaskRequest request) {
        return ResponseEntity.ok(ApiResponse.success(taskService.update(id, request)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Changer le statut d'une tâche")
    public ResponseEntity<ApiResponse<TaskDto>> changeStatus(
            @PathVariable UUID id, @RequestParam Task.TaskStatus status) {
        return ResponseEntity.ok(ApiResponse.success(taskService.changeStatus(id, status)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une tâche")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        taskService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/comments")
    @Operation(summary = "Ajouter un commentaire à une tâche")
    public ResponseEntity<ApiResponse<TaskDto.TaskCommentDto>> addComment(
            @PathVariable UUID id, @Valid @RequestBody AddTaskCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(taskService.addComment(id, request)));
    }
}
