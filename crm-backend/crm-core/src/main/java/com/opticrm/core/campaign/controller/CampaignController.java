package com.opticrm.core.campaign.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageResponse;
import com.opticrm.core.campaign.dto.*;
import com.opticrm.core.campaign.service.CampaignService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/campaigns")
@RequiredArgsConstructor
@Tag(name = "Campaigns", description = "Campaign management")
public class CampaignController {

    private final CampaignService campaignService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    @Operation(summary = "List campaigns")
    public ResponseEntity<ApiResponse<PageResponse<CampaignListDto>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type
    ) {
        Page<CampaignListDto> result = campaignService.list(page, size, search, status, type);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    @Operation(summary = "Get campaign by ID")
    public ResponseEntity<ApiResponse<CampaignDto>> getById(@PathVariable UUID id) {
        CampaignDto campaign = campaignService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(campaign));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    @Operation(summary = "Create campaign")
    public ResponseEntity<ApiResponse<CampaignDto>> create(@Valid @RequestBody CreateCampaignRequest request) {
        CampaignDto campaign = campaignService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(campaign));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    @Operation(summary = "Update campaign")
    public ResponseEntity<ApiResponse<CampaignDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCampaignRequest request
    ) {
        CampaignDto campaign = campaignService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(campaign));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    @Operation(summary = "Delete campaign")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        campaignService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
