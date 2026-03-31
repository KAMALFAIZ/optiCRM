package com.opticrm.core.account.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.core.account.service.IndustryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/industries")
@RequiredArgsConstructor
public class IndustryController {

    private final IndustryService industryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<IndustryService.IndustryDto>>> getAll() {
        List<IndustryService.IndustryDto> industries = industryService.getAll();
        return ResponseEntity.ok(ApiResponse.success(industries));
    }
}
