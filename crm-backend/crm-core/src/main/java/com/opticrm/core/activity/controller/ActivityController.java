package com.opticrm.core.activity.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageMeta;
import com.opticrm.common.dto.PageRequest;
import com.opticrm.core.activity.dto.*;
import com.opticrm.core.activity.service.ActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<ActivityListDto>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String activityType,
            @RequestParam(required = false) String assignedToId
    ) {
        PageRequest pageRequest = PageRequest.builder()
                .page(page)
                .perPage(perPage)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        Page<ActivityListDto> result = activityService.list(pageRequest, search, status, activityType, assignedToId);

        return ResponseEntity.ok(ApiResponse.success(
                result.getContent(),
                PageMeta.from(result)
        ));
    }

    @GetMapping("/calendar")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<ActivityListDto>>> calendarEvents(
            @RequestParam Instant from,
            @RequestParam Instant to,
            @RequestParam(required = false) String assignedToId
    ) {
        List<ActivityListDto> events = activityService.getCalendarEvents(from, to, assignedToId);
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ActivityDto>> getById(@PathVariable UUID id) {
        ActivityDto activity = activityService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(activity));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ActivityDto>> create(
            @Valid @RequestBody CreateActivityRequest request
    ) {
        ActivityDto activity = activityService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(activity));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ActivityDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateActivityRequest request
    ) {
        ActivityDto activity = activityService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(activity));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        activityService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ActivityDto>> complete(@PathVariable UUID id) {
        ActivityDto activity = activityService.complete(id);
        return ResponseEntity.ok(ApiResponse.success(activity));
    }
}
