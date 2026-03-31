package com.opticrm.core.visit.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageMeta;
import com.opticrm.common.dto.PageRequest;
import com.opticrm.core.visit.dto.*;
import com.opticrm.core.visit.service.VisitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/visits")
@RequiredArgsConstructor
public class VisitController {

    private final VisitService visitService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<List<VisitListDto>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String visitType,
            @RequestParam(required = false) String assignedToId
    ) {
        PageRequest pageRequest = PageRequest.builder()
                .page(page)
                .perPage(perPage)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        Page<VisitListDto> result = visitService.list(pageRequest, search, status, visitType, assignedToId);

        return ResponseEntity.ok(ApiResponse.success(
                result.getContent(),
                PageMeta.from(result)
        ));
    }

    @GetMapping("/calendar")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<List<VisitListDto>>> calendarEvents(
            @RequestParam Instant from,
            @RequestParam Instant to,
            @RequestParam(required = false) String assignedToId
    ) {
        List<VisitListDto> events = visitService.getCalendarEvents(from, to, assignedToId);
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<VisitDto>> getById(@PathVariable UUID id) {
        VisitDto visit = visitService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(visit));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL')")
    public ResponseEntity<ApiResponse<VisitDto>> create(
            @Valid @RequestBody CreateVisitRequest request
    ) {
        VisitDto visit = visitService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(visit));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL')")
    public ResponseEntity<ApiResponse<VisitDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVisitRequest request
    ) {
        VisitDto visit = visitService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(visit));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        visitService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/check-in")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL')")
    public ResponseEntity<ApiResponse<VisitDto>> checkIn(
            @PathVariable UUID id,
            @RequestParam(required = false) BigDecimal latitude,
            @RequestParam(required = false) BigDecimal longitude
    ) {
        VisitDto visit = visitService.checkIn(id, latitude, longitude);
        return ResponseEntity.ok(ApiResponse.success(visit));
    }

    @PatchMapping("/{id}/check-out")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL')")
    public ResponseEntity<ApiResponse<VisitDto>> checkOut(
            @PathVariable UUID id,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) String outcome
    ) {
        VisitDto visit = visitService.checkOut(id, notes, outcome);
        return ResponseEntity.ok(ApiResponse.success(visit));
    }
}
