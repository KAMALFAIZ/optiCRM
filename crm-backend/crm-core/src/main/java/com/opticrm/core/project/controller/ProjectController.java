package com.opticrm.core.project.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageResponse;
import com.opticrm.core.project.dto.*;
import com.opticrm.core.project.entity.Project;
import com.opticrm.core.project.entity.ProjectMember;
import com.opticrm.core.project.service.ProjectService;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Tag(name = "Projets", description = "API de gestion des projets")
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @Operation(summary = "Liste des projets")
    public ResponseEntity<ApiResponse<PageResponse<ProjectListDto>>> getAll(
            @RequestParam(required = false) Project.ProjectStatus status,
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) UUID managerId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ProjectListDto> result = projectService.findAll(status, accountId, managerId, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'un projet")
    public ResponseEntity<ApiResponse<ProjectDto>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.findById(id)));
    }

    @PostMapping
    @Operation(summary = "Créer un projet")
    public ResponseEntity<ApiResponse<ProjectDto>> create(@Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(projectService.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier un projet")
    public ResponseEntity<ApiResponse<ProjectDto>> update(
            @PathVariable UUID id, @Valid @RequestBody UpdateProjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success(projectService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un projet")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        projectService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── Membres ────────────────────────────────────────────────────────────

    @PostMapping("/{id}/members")
    @Operation(summary = "Ajouter un membre au projet")
    public ResponseEntity<ApiResponse<ProjectDto>> addMember(
            @PathVariable UUID id,
            @RequestParam UUID userId,
            @RequestParam(required = false) ProjectMember.MemberRole role) {
        return ResponseEntity.ok(ApiResponse.success(projectService.addMember(id, userId, role)));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @Operation(summary = "Retirer un membre du projet")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID id, @PathVariable UUID userId) {
        projectService.removeMember(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── Milestones ─────────────────────────────────────────────────────────

    @PostMapping("/{id}/milestones")
    @Operation(summary = "Créer un milestone")
    public ResponseEntity<ApiResponse<MilestoneDto>> createMilestone(
            @PathVariable UUID id, @Valid @RequestBody CreateMilestoneRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(projectService.createMilestone(id, request)));
    }

    @PutMapping("/milestones/{milestoneId}")
    @Operation(summary = "Modifier un milestone")
    public ResponseEntity<ApiResponse<MilestoneDto>> updateMilestone(
            @PathVariable UUID milestoneId, @Valid @RequestBody CreateMilestoneRequest request) {
        return ResponseEntity.ok(ApiResponse.success(projectService.updateMilestone(milestoneId, request)));
    }

    @DeleteMapping("/milestones/{milestoneId}")
    @Operation(summary = "Supprimer un milestone")
    public ResponseEntity<ApiResponse<Void>> deleteMilestone(@PathVariable UUID milestoneId) {
        projectService.deleteMilestone(milestoneId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
