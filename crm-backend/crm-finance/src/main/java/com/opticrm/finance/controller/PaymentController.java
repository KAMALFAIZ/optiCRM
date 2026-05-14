package com.opticrm.finance.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageResponse;
import com.opticrm.finance.dto.*;
import com.opticrm.finance.entity.Payment;
import com.opticrm.finance.service.PaymentService;
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
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "API de gestion des paiements")
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    @Operation(summary = "Liste des paiements", description = "Récupère la liste paginée des paiements avec filtres optionnels")
    public ResponseEntity<ApiResponse<PageResponse<PaymentListDto>>> getAll(
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) Payment.PaymentStatus status,
            @RequestParam(required = false) Payment.PaymentMethod paymentMethod,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "paymentDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<PaymentListDto> payments;
        if (search != null && !search.isBlank()) {
            payments = paymentService.search(search.trim(), pageable);
        } else {
            payments = paymentService.findAll(accountId, status, paymentMethod, startDate, endDate, pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(payments)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'un paiement", description = "Récupère le détail d'un paiement par son ID")
    public ResponseEntity<ApiResponse<PaymentDto>> getById(@PathVariable UUID id) {
        PaymentDto payment = paymentService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(payment));
    }

    @GetMapping("/account/{accountId}")
    @Operation(summary = "Paiements d'un compte", description = "Récupère tous les paiements d'un compte")
    public ResponseEntity<ApiResponse<List<PaymentListDto>>> getByAccount(@PathVariable UUID accountId) {
        List<PaymentListDto> payments = paymentService.findByAccountId(accountId);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @GetMapping("/stats")
    @Operation(summary = "Statistiques des paiements", description = "Récupère les statistiques des paiements")
    public ResponseEntity<ApiResponse<PaymentStatsDto>> getStats() {
        PaymentStatsDto stats = paymentService.getStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @PostMapping
    @Operation(summary = "Créer un paiement", description = "Crée un nouveau paiement")
    public ResponseEntity<ApiResponse<PaymentDto>> create(@Valid @RequestBody CreatePaymentRequest request) {
        PaymentDto payment = paymentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(payment));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier un paiement", description = "Modifie un paiement existant")
    public ResponseEntity<ApiResponse<PaymentDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePaymentRequest request) {
        PaymentDto payment = paymentService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(payment));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un paiement", description = "Supprime un paiement")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        paymentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/allocations")
    @Operation(summary = "Allouer un paiement", description = "Alloue un paiement à une facture")
    public ResponseEntity<ApiResponse<PaymentAllocationDto>> allocate(
            @PathVariable UUID id,
            @Valid @RequestBody CreateAllocationRequest request) {
        PaymentAllocationDto allocation = paymentService.allocate(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(allocation));
    }

    @DeleteMapping("/{paymentId}/allocations/{allocationId}")
    @Operation(summary = "Supprimer une allocation", description = "Supprime une allocation de paiement")
    public ResponseEntity<ApiResponse<Void>> removeAllocation(
            @PathVariable UUID paymentId,
            @PathVariable UUID allocationId) {
        paymentService.removeAllocation(paymentId, allocationId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
