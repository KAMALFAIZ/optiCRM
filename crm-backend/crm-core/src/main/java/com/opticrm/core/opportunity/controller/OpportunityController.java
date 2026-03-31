package com.opticrm.core.opportunity.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageMeta;
import com.opticrm.common.dto.PageRequest;
import com.opticrm.core.opportunity.dto.*;
import com.opticrm.core.opportunity.service.OpportunityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/opportunities")
@RequiredArgsConstructor
public class OpportunityController {

    private final OpportunityService opportunityService;

    @GetMapping("/stages")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<List<OpportunityStageDto>>> getAllStages() {
        List<OpportunityStageDto> stages = opportunityService.getAllStages();
        return ResponseEntity.ok(ApiResponse.success(stages));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<List<OpportunityListDto>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String stageId,
            @RequestParam(required = false) String accountId,
            @RequestParam(required = false) String assignedToId,
            @RequestParam(required = false) Boolean isClosed
    ) {
        PageRequest pageRequest = PageRequest.builder()
                .page(page)
                .perPage(perPage)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        Page<OpportunityListDto> result = opportunityService.list(pageRequest, search, stageId, accountId, assignedToId, isClosed);

        return ResponseEntity.ok(ApiResponse.success(
                result.getContent(),
                PageMeta.from(result)
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<OpportunityDto>> getById(@PathVariable UUID id) {
        OpportunityDto opportunity = opportunityService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(opportunity));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL')")
    public ResponseEntity<ApiResponse<OpportunityDto>> create(
            @Valid @RequestBody CreateOpportunityRequest request
    ) {
        OpportunityDto opportunity = opportunityService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(opportunity));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL')")
    public ResponseEntity<ApiResponse<OpportunityDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOpportunityRequest request
    ) {
        OpportunityDto opportunity = opportunityService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(opportunity));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        opportunityService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/by-account/{accountId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<List<OpportunityListDto>>> getByAccount(@PathVariable UUID accountId) {
        List<OpportunityListDto> opportunities = opportunityService.getByAccount(accountId);
        return ResponseEntity.ok(ApiResponse.success(opportunities));
    }

    // ---- Pipeline Kanban ----

    /**
     * Vue Kanban : opportunités ouvertes groupées par étape avec prévision.
     * GET /api/v1/opportunities/pipeline?assignedToId=...
     */
    @GetMapping("/pipeline")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<PipelineSummaryDto>> getPipeline(
            @RequestParam(required = false) String assignedToId) {
        PipelineSummaryDto pipeline = opportunityService.getPipeline(assignedToId);
        return ResponseEntity.ok(ApiResponse.success(pipeline));
    }

    /**
     * Déplacement Kanban : change l'étape d'une opportunité.
     * PATCH /api/v1/opportunities/{id}/stage
     */
    @PatchMapping("/{id}/stage")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL')")
    public ResponseEntity<ApiResponse<OpportunityListDto>> moveToStage(
            @PathVariable UUID id,
            @Valid @RequestBody MoveStageRequest request) {
        OpportunityListDto result = opportunityService.moveToStage(id, request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
