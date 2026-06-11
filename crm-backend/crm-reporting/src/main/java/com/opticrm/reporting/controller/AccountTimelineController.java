package com.opticrm.reporting.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.reporting.dto.AccountTimelineDto;
import com.opticrm.reporting.service.AccountTimelineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@Slf4j
public class AccountTimelineController {

    private final AccountTimelineService accountTimelineService;

    @GetMapping("/api/v1/accounts/{id}/timeline")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<AccountTimelineDto>> getTimeline(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(required = false) String types
    ) {
        log.debug("GET /api/v1/accounts/{}/timeline?limit={}&types={}", id, limit, types);

        Set<String> typeFilter = null;
        if (types != null && !types.isBlank()) {
            typeFilter = Arrays.stream(types.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toSet());
        }

        AccountTimelineDto timeline = accountTimelineService.getTimeline(id, limit, typeFilter);
        return ResponseEntity.ok(ApiResponse.success(timeline));
    }
}
