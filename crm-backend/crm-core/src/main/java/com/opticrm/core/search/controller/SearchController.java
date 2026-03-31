package com.opticrm.core.search.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.core.search.dto.GlobalSearchResult;
import com.opticrm.core.search.service.GlobalSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@Tag(name = "Global Search", description = "Search across all entities")
public class SearchController {

    private final GlobalSearchService globalSearchService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    @Operation(summary = "Global search", description = "Search across accounts, contacts, leads, and opportunities")
    public ResponseEntity<ApiResponse<GlobalSearchResult>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "10") int limit
    ) {
        GlobalSearchResult result = globalSearchService.search(q, limit);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
