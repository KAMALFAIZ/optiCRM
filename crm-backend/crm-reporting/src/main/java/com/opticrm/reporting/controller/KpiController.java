package com.opticrm.reporting.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.reporting.dto.CommercialKpiDto;
import com.opticrm.reporting.dto.SupervisionDto;
import com.opticrm.reporting.dto.TrendDataDto;
import com.opticrm.reporting.service.KpiService;
import com.opticrm.reporting.service.SupervisionService;
import com.opticrm.reporting.service.SupervisorAssignmentService;
import com.opticrm.reporting.service.TrendService;
import com.opticrm.security.dto.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/kpis")
@RequiredArgsConstructor
@Slf4j
public class KpiController {

    private final KpiService kpiService;
    private final SupervisionService supervisionService;
    private final SupervisorAssignmentService assignmentService;
    private final TrendService trendService;

    @GetMapping("/commercial")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<CommercialKpiDto>>> getCommercialKpis(
            @AuthenticationPrincipal UserPrincipal principal) {
        log.debug("GET /api/v1/kpis/commercial by {}", principal.getId());
        Set<UUID> filter = resolveFilter(principal);
        List<CommercialKpiDto> kpis = kpiService.getCommercialKpis(filter);
        return ResponseEntity.ok(ApiResponse.success(kpis));
    }

    @GetMapping("/supervision")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<SupervisionDto>> getSupervision(
            @AuthenticationPrincipal UserPrincipal principal) {
        log.debug("GET /api/v1/kpis/supervision by {}", principal.getId());
        Set<UUID> filter = resolveFilter(principal);
        SupervisionDto supervision = supervisionService.buildSupervision(filter);
        return ResponseEntity.ok(ApiResponse.success(supervision));
    }

    @GetMapping("/trends")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<TrendDataDto>> getTrends(
            @AuthenticationPrincipal UserPrincipal principal) {
        log.debug("GET /api/v1/kpis/trends by {}", principal.getId());
        Set<UUID> filter = resolveFilter(principal);
        TrendDataDto trends = trendService.buildTrends(filter);
        return ResponseEntity.ok(ApiResponse.success(trends));
    }

    private Set<UUID> resolveFilter(UserPrincipal principal) {
        if (principal.isAdmin() || principal.hasRole("MANAGER")) {
            return null; // null = no filter, show all
        }
        List<UUID> ids = assignmentService.getCollaboratorIds(principal.getId());
        return ids.isEmpty() ? Set.of() : Set.copyOf(ids);
    }
}
