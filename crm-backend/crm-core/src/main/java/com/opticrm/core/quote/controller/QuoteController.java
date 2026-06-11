package com.opticrm.core.quote.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageMeta;
import com.opticrm.common.dto.PageRequest;
import com.opticrm.core.quote.dto.*;
import com.opticrm.core.quote.service.QuoteService;
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
@RequestMapping("/api/v1/quotes")
@RequiredArgsConstructor
public class QuoteController {

    private final QuoteService quoteService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<QuoteListDto>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String accountId,
            @RequestParam(required = false) String assignedToId
    ) {
        PageRequest pageRequest = PageRequest.builder()
                .page(page)
                .perPage(perPage)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        Page<QuoteListDto> result = quoteService.list(pageRequest, search, status, accountId, assignedToId);

        return ResponseEntity.ok(ApiResponse.success(
                result.getContent(),
                PageMeta.from(result)
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<QuoteDto>> getById(@PathVariable UUID id) {
        QuoteDto quote = quoteService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(quote));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<QuoteDto>> create(
            @Valid @RequestBody CreateQuoteRequest request
    ) {
        QuoteDto quote = quoteService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(quote));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<QuoteDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateQuoteRequest request
    ) {
        QuoteDto quote = quoteService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(quote));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        quoteService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/by-account/{accountId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<QuoteListDto>>> getByAccount(@PathVariable UUID accountId) {
        List<QuoteListDto> quotes = quoteService.getByAccount(accountId);
        return ResponseEntity.ok(ApiResponse.success(quotes));
    }

    @GetMapping("/by-opportunity/{opportunityId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<QuoteListDto>>> getByOpportunity(@PathVariable UUID opportunityId) {
        List<QuoteListDto> quotes = quoteService.getByOpportunity(opportunityId);
        return ResponseEntity.ok(ApiResponse.success(quotes));
    }

    @GetMapping("/by-chantier/{chantierId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<QuoteListDto>>> getByChantier(@PathVariable UUID chantierId) {
        List<QuoteListDto> quotes = quoteService.getByChantier(chantierId);
        return ResponseEntity.ok(ApiResponse.success(quotes));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<QuoteDto>> updateStatus(
            @PathVariable UUID id,
            @RequestParam String status
    ) {
        QuoteDto quote = quoteService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(quote));
    }

    @PostMapping("/{id}/duplicate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<QuoteDto>> duplicate(@PathVariable UUID id) {
        QuoteDto quote = quoteService.duplicate(id);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(quote));
    }
}
