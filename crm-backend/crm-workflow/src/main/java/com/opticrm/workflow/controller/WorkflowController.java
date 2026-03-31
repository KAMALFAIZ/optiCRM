package com.opticrm.workflow.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageMeta;
import com.opticrm.common.dto.PageRequest;
import com.opticrm.workflow.dto.*;
import com.opticrm.workflow.engine.WorkflowEngine;
import com.opticrm.workflow.entity.Workflow;
import com.opticrm.workflow.repository.WorkflowRepository;
import com.opticrm.workflow.service.WorkflowService;
import com.opticrm.workflow.service.WorkflowTemplateService;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.security.config.ContextUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workflows")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService         workflowService;
    private final WorkflowTemplateService  workflowTemplateService;
    private final WorkflowEngine           workflowEngine;
    private final WorkflowRepository       workflowRepository;

    // ── Workflow CRUD ─────────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<WorkflowListDto>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Boolean isActive
    ) {
        PageRequest pageRequest = PageRequest.builder()
                .page(page).perPage(perPage).sortBy(sortBy).sortDirection(sortDirection).build();
        Page<WorkflowListDto> result = workflowService.list(pageRequest, search, entityType, isActive);
        return ResponseEntity.ok(ApiResponse.success(result.getContent(), PageMeta.from(result)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<WorkflowDto>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(workflowService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowDto>> create(@Valid @RequestBody CreateWorkflowRequest request) {
        WorkflowDto wf = workflowService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(wf));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWorkflowRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(workflowService.update(id, request)));
    }

    @PostMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowDto>> toggleActive(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(workflowService.toggleActive(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        workflowService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── Manual trigger ───────────────────────────────────────────────────────

    @PostMapping("/{id}/execute")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<WorkflowExecutionDto>> execute(
            @PathVariable UUID id,
            @RequestParam String entityId
    ) {
        Workflow wf = workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found with id: " + id));
        UUID triggeredBy = ContextUtils.getCurrentUserId().orElse(null);
        var execution = workflowEngine.startExecution(wf, wf.getEntityType(), UUID.fromString(entityId), triggeredBy);
        return ResponseEntity.ok(ApiResponse.success(workflowService.getExecutionById(execution.getId())));
    }

    // ── Executions ───────────────────────────────────────────────────────────

    @GetMapping("/executions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<WorkflowExecutionDto>>> listExecutions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage,
            @RequestParam(required = false) String workflowId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String entityType
    ) {
        PageRequest pageRequest = PageRequest.builder().page(page).perPage(perPage).build();
        UUID wfId = workflowId != null ? UUID.fromString(workflowId) : null;
        Page<WorkflowExecutionDto> result = workflowService.listExecutions(pageRequest, wfId, status, entityType);
        return ResponseEntity.ok(ApiResponse.success(result.getContent(), PageMeta.from(result)));
    }

    @GetMapping("/executions/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<WorkflowExecutionDto>> getExecution(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(workflowService.getExecutionById(id)));
    }

    @PostMapping("/executions/{id}/cancel")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowExecutionDto>> cancelExecution(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(workflowService.cancelExecution(id)));
    }

    @PostMapping("/executions/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> approveExecution(
            @PathVariable UUID id,
            @RequestParam boolean approved
    ) {
        workflowEngine.handleApproval(id, approved);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── Stats ────────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<WorkflowStatsDto>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(workflowService.getStats()));
    }

    // ── Templates ─────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/workflows/templates
     * Liste paginée des templates avec filtres optionnels.
     */
    @GetMapping("/templates")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<WorkflowTemplateListDto>>> listTemplates(
            @RequestParam(defaultValue = "1")  int    page,
            @RequestParam(defaultValue = "50") int    perPage,
            @RequestParam(required = false)    String search,
            @RequestParam(required = false)    String category,
            @RequestParam(required = false)    String entityType
    ) {
        PageRequest pageRequest = PageRequest.builder()
                .page(page).perPage(perPage).build();
        Page<WorkflowTemplateListDto> result =
                workflowTemplateService.list(pageRequest, search, category, entityType);
        return ResponseEntity.ok(ApiResponse.success(result.getContent(), PageMeta.from(result)));
    }

    /**
     * GET /api/v1/workflows/templates/{id}
     * Détail d'un template (avec aperçu des étapes).
     */
    @GetMapping("/templates/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<WorkflowTemplateDto>> getTemplate(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(workflowTemplateService.getById(id)));
    }

    /**
     * POST /api/v1/workflows/templates/{id}/use
     * Crée un workflow actif à partir du template.
     * Body (optionnel) : { "name": "Mon workflow personnalisé" }
     */
    @PostMapping("/templates/{id}/use")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<WorkflowDto>> useTemplate(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String customName = body != null ? body.get("name") : null;
        WorkflowDto created = workflowTemplateService.createWorkflowFromTemplate(id, customName);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }
}
