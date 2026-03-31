package com.opticrm.reporting.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.reporting.dto.CommercialKpiDto;
import com.opticrm.reporting.service.KpiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/kpis")
@RequiredArgsConstructor
@Slf4j
public class KpiController {

    private final KpiService kpiService;

    @GetMapping("/commercial")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<CommercialKpiDto>>> getCommercialKpis() {
        log.debug("GET /api/v1/kpis/commercial");
        List<CommercialKpiDto> kpis = kpiService.getCommercialKpis();
        return ResponseEntity.ok(ApiResponse.success(kpis));
    }
}
