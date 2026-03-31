package com.opticrm.reporting.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.reporting.dto.ForecastDto;
import com.opticrm.reporting.service.ForecastService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/forecast")
@RequiredArgsConstructor
@Slf4j
public class ForecastController {

    private final ForecastService forecastService;

    @GetMapping("/monthly")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<ForecastDto.ForecastByMonth>>> getMonthlyForecast(
            @RequestParam(defaultValue = "6") int months
    ) {
        log.debug("GET /api/v1/forecast/monthly?months={}", months);
        List<ForecastDto.ForecastByMonth> forecast = forecastService.getMonthlyForecast(months);
        return ResponseEntity.ok(ApiResponse.success(forecast));
    }

    @GetMapping("/by-rep")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<ForecastDto.ForecastByRep>>> getByRep() {
        log.debug("GET /api/v1/forecast/by-rep");
        List<ForecastDto.ForecastByRep> forecast = forecastService.getByRep();
        return ResponseEntity.ok(ApiResponse.success(forecast));
    }
}
