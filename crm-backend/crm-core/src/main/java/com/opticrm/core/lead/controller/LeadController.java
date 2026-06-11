package com.opticrm.core.lead.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageMeta;
import com.opticrm.common.dto.PageRequest;
import com.opticrm.core.lead.dto.*;
import com.opticrm.core.lead.service.LeadScoreService;
import com.opticrm.core.lead.service.LeadService;
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
@RequestMapping("/api/v1/leads")
@RequiredArgsConstructor
public class LeadController {

    private final LeadService leadService;
    private final LeadScoreService leadScoreService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<LeadListDto>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String assignedToId
    ) {
        PageRequest pageRequest = PageRequest.builder()
                .page(page)
                .perPage(perPage)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        Page<LeadListDto> result = leadService.list(pageRequest, search, status, source, assignedToId);

        return ResponseEntity.ok(ApiResponse.success(
                result.getContent(),
                PageMeta.from(result)
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<LeadDto>> getById(@PathVariable UUID id) {
        LeadDto lead = leadService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(lead));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<LeadDto>> create(
            @Valid @RequestBody CreateLeadRequest request
    ) {
        LeadDto lead = leadService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(lead));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<LeadDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLeadRequest request
    ) {
        LeadDto lead = leadService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(lead));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        leadService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/convert")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ConvertLeadResponse>> convert(
            @PathVariable UUID id,
            @RequestBody ConvertLeadRequest request
    ) {
        ConvertLeadResponse response = leadService.convert(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ── Score de qualification ────────────────────────────────────────────────

    @GetMapping("/{id}/score")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<LeadScoreDto>> getScore(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(leadScoreService.compute(id)));
    }

    @PostMapping("/{id}/score/refresh")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<LeadScoreDto>> refreshScore(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(leadScoreService.computeAndPersist(id)));
    }

    @GetMapping("/duplicates")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<LeadDto>>> findDuplicates(
            @RequestParam(required = false) String firstName,
            @RequestParam String lastName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone
    ) {
        List<LeadDto> duplicates = leadService.findDuplicates(firstName, lastName, email, phone);
        return ResponseEntity.ok(ApiResponse.success(duplicates));
    }
}
