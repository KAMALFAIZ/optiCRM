package com.opticrm.reporting.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.reporting.dto.AssignCollaboratorRequest;
import com.opticrm.reporting.dto.CollaboratorSummaryDto;
import com.opticrm.reporting.dto.SupervisorAssignmentDto;
import com.opticrm.reporting.service.SupervisorAssignmentService;
import com.opticrm.security.dto.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/supervisor")
@RequiredArgsConstructor
@Slf4j
public class SupervisorController {

    private final SupervisorAssignmentService assignmentService;

    @GetMapping("/collaborators")
    @PreAuthorize("hasAnyRole('SUPERVISEUR', 'SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<SupervisorAssignmentDto>>> getMyCollaborators(
            @AuthenticationPrincipal UserPrincipal principal) {
        log.debug("GET /supervisor/collaborators for user {}", principal.getId());
        List<SupervisorAssignmentDto> result = assignmentService.getMyCollaborators(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/collaborators")
    @PreAuthorize("hasAnyRole('SUPERVISEUR', 'SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<SupervisorAssignmentDto>> assignCollaborator(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AssignCollaboratorRequest request) {
        log.debug("POST /supervisor/collaborators — assign {} to {}", request.getCollaboratorId(), principal.getId());
        SupervisorAssignmentDto result = assignmentService.assignCollaborator(
                principal.getId(), request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @DeleteMapping("/collaborators/{collaboratorId}")
    @PreAuthorize("hasAnyRole('SUPERVISEUR', 'SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> unassignCollaborator(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID collaboratorId) {
        log.debug("DELETE /supervisor/collaborators/{} for {}", collaboratorId, principal.getId());
        assignmentService.unassignCollaborator(principal.getId(), collaboratorId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/assignable-users")
    @PreAuthorize("hasAnyRole('SUPERVISEUR', 'SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<CollaboratorSummaryDto>>> getAssignableUsers(
            @AuthenticationPrincipal UserPrincipal principal) {
        log.debug("GET /supervisor/assignable-users for {}", principal.getId());
        List<CollaboratorSummaryDto> result = assignmentService.getAssignableUsers(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // --- Admin endpoints: manage assignments for any supervisor ---

    @GetMapping("/admin/{supervisorId}/collaborators")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<SupervisorAssignmentDto>>> getCollaboratorsForSupervisor(
            @PathVariable UUID supervisorId) {
        log.debug("GET /supervisor/admin/{}/collaborators", supervisorId);
        List<SupervisorAssignmentDto> result = assignmentService.getMyCollaborators(supervisorId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/admin/{supervisorId}/collaborators")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<SupervisorAssignmentDto>> assignCollaboratorForSupervisor(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID supervisorId,
            @Valid @RequestBody AssignCollaboratorRequest request) {
        log.debug("POST /supervisor/admin/{}/collaborators — assign {}", supervisorId, request.getCollaboratorId());
        SupervisorAssignmentDto result = assignmentService.assignCollaborator(
                supervisorId, request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @DeleteMapping("/admin/{supervisorId}/collaborators/{collaboratorId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> unassignCollaboratorForSupervisor(
            @PathVariable UUID supervisorId,
            @PathVariable UUID collaboratorId) {
        log.debug("DELETE /supervisor/admin/{}/collaborators/{}", supervisorId, collaboratorId);
        assignmentService.unassignCollaborator(supervisorId, collaboratorId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
