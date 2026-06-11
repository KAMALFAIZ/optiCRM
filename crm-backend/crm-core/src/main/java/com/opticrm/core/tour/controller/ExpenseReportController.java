package com.opticrm.core.tour.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageResponse;
import com.opticrm.core.tour.dto.*;
import com.opticrm.core.tour.entity.ExpenseReport.ExpenseReportStatus;
import com.opticrm.core.tour.service.ExpenseReportService;
import com.opticrm.security.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/expense-reports")
@RequiredArgsConstructor
@Tag(name = "Expense Reports", description = "API de gestion des notes de frais")
public class ExpenseReportController {

    private final ExpenseReportService expenseReportService;
    private final FileStorageService fileStorageService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    @Operation(summary = "Liste des notes de frais")
    public ResponseEntity<ApiResponse<PageResponse<ExpenseReportListDto>>> getAll(
            @RequestParam(required = false) UUID tourId,
            @RequestParam(required = false) ExpenseReportStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ExpenseReportListDto> result = expenseReportService.findAll(tourId, status, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    @Operation(summary = "Détail d'une note de frais")
    public ResponseEntity<ApiResponse<ExpenseReportDto>> getById(@PathVariable UUID id) {
        ExpenseReportDto report = expenseReportService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/tour/{tourId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    @Operation(summary = "Notes de frais d'une tournée")
    public ResponseEntity<ApiResponse<List<ExpenseReportListDto>>> getByTour(@PathVariable UUID tourId) {
        List<ExpenseReportListDto> reports = expenseReportService.findByTourId(tourId);
        return ResponseEntity.ok(ApiResponse.success(reports));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    @Operation(summary = "Créer une note de frais")
    public ResponseEntity<ApiResponse<ExpenseReportDto>> create(
            @Valid @RequestBody CreateExpenseReportRequest request) {
        ExpenseReportDto report = expenseReportService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(report));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    @Operation(summary = "Modifier une note de frais (brouillon uniquement)")
    public ResponseEntity<ApiResponse<ExpenseReportDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateExpenseReportRequest request) {
        ExpenseReportDto report = expenseReportService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    @Operation(summary = "Supprimer une note de frais (brouillon uniquement)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        expenseReportService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    @Operation(summary = "Soumettre une note de frais pour approbation")
    public ResponseEntity<ApiResponse<ExpenseReportDto>> submit(@PathVariable UUID id) {
        ExpenseReportDto report = expenseReportService.submit(id);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    @Operation(summary = "Approuver une note de frais")
    public ResponseEntity<ApiResponse<ExpenseReportDto>> approve(@PathVariable UUID id) {
        ExpenseReportDto report = expenseReportService.approve(id);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    @Operation(summary = "Rejeter une note de frais")
    public ResponseEntity<ApiResponse<ExpenseReportDto>> reject(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "");
        ExpenseReportDto report = expenseReportService.reject(id, reason);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PatchMapping("/{id}/reimburse")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Marquer une note de frais comme remboursée")
    public ResponseEntity<ApiResponse<ExpenseReportDto>> reimburse(@PathVariable UUID id) {
        ExpenseReportDto report = expenseReportService.markReimbursed(id);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PostMapping("/upload-receipt")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    @Operation(summary = "Uploader un justificatif")
    public ResponseEntity<ApiResponse<String>> uploadReceipt(@RequestParam("file") MultipartFile file) throws IOException {
        String url = fileStorageService.storeReceipt(file);
        return ResponseEntity.ok(ApiResponse.success(url));
    }
}
