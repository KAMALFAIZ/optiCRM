package com.opticrm.communication.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageResponse;
import com.opticrm.communication.dto.*;
import com.opticrm.communication.service.EmailTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/email-templates")
@RequiredArgsConstructor
public class EmailTemplateController {

    private final EmailTemplateService emailTemplateService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<EmailTemplateListDto>>> getAll(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<EmailTemplateListDto> templates;
        if (search != null && !search.isBlank()) {
            templates = emailTemplateService.search(search.trim(), pageable);
        } else {
            templates = emailTemplateService.findAll(category, isActive, pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(templates)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmailTemplateDto>> getById(@PathVariable UUID id) {
        EmailTemplateDto template = emailTemplateService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(template));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmailTemplateDto>> create(@Valid @RequestBody CreateEmailTemplateRequest request) {
        EmailTemplateDto template = emailTemplateService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(template));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmailTemplateDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEmailTemplateRequest request) {
        EmailTemplateDto template = emailTemplateService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(template));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        emailTemplateService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<ApiResponse<EmailTemplateDto>> toggleActive(@PathVariable UUID id) {
        EmailTemplateDto template = emailTemplateService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.success(template));
    }
}
