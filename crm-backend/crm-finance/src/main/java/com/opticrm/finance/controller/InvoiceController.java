package com.opticrm.finance.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageResponse;
import com.opticrm.finance.dto.*;
import com.opticrm.finance.entity.Invoice;
import com.opticrm.finance.service.InvoiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
@Tag(name = "Invoices", description = "API de gestion des factures")
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    @Operation(summary = "Liste des factures", description = "Récupère la liste paginée des factures avec filtres optionnels")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceListDto>>> getAll(
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) Invoice.InvoiceStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "invoiceDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<InvoiceListDto> invoices;
        if (search != null && !search.isBlank()) {
            invoices = invoiceService.search(search.trim(), pageable);
        } else {
            invoices = invoiceService.findAll(accountId, status, startDate, endDate, pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(invoices)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'une facture", description = "Récupère le détail d'une facture par son ID")
    public ResponseEntity<ApiResponse<InvoiceDto>> getById(@PathVariable UUID id) {
        InvoiceDto invoice = invoiceService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    @GetMapping("/account/{accountId}")
    @Operation(summary = "Factures d'un compte", description = "Récupère toutes les factures d'un compte")
    public ResponseEntity<ApiResponse<List<InvoiceListDto>>> getByAccount(@PathVariable UUID accountId) {
        List<InvoiceListDto> invoices = invoiceService.findByAccountId(accountId);
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }

    @GetMapping("/stats")
    @Operation(summary = "Statistiques des factures", description = "Récupère les statistiques des factures")
    public ResponseEntity<ApiResponse<InvoiceStatsDto>> getStats() {
        InvoiceStatsDto stats = invoiceService.getStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @PostMapping
    @Operation(summary = "Créer une facture", description = "Crée une nouvelle facture")
    public ResponseEntity<ApiResponse<InvoiceDto>> create(@Valid @RequestBody CreateInvoiceRequest request) {
        InvoiceDto invoice = invoiceService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(invoice));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier une facture", description = "Modifie une facture existante")
    public ResponseEntity<ApiResponse<InvoiceDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInvoiceRequest request) {
        InvoiceDto invoice = invoiceService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une facture", description = "Supprime une facture en brouillon")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        invoiceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/send")
    @Operation(summary = "Envoyer une facture", description = "Marque une facture comme envoyée")
    public ResponseEntity<ApiResponse<InvoiceDto>> send(@PathVariable UUID id) {
        InvoiceDto invoice = invoiceService.markAsSent(id);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    @PatchMapping("/{id}/mark-paid")
    @Operation(summary = "Marquer comme payée", description = "Marque une facture comme payée")
    public ResponseEntity<ApiResponse<InvoiceDto>> markPaid(@PathVariable UUID id) {
        InvoiceDto invoice = invoiceService.markAsPaid(id);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Annuler une facture", description = "Annule une facture")
    public ResponseEntity<ApiResponse<InvoiceDto>> cancel(@PathVariable UUID id) {
        InvoiceDto invoice = invoiceService.cancel(id);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }
}
