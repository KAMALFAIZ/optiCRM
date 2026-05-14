package com.opticrm.finance.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageResponse;
import com.opticrm.finance.dto.*;
import com.opticrm.finance.entity.SalesOrder;
import com.opticrm.finance.service.SalesOrderService;
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
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Sales Orders", description = "API de gestion des commandes")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @GetMapping
    @Operation(summary = "Liste des commandes", description = "Récupère la liste paginée des commandes")
    public ResponseEntity<ApiResponse<PageResponse<SalesOrderListDto>>> getAll(
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) SalesOrder.OrderStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "orderDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<SalesOrderListDto> orders;
        if (search != null && !search.isBlank()) {
            orders = salesOrderService.search(search.trim(), pageable);
        } else {
            orders = salesOrderService.findAll(accountId, status, startDate, endDate, pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(orders)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'une commande")
    public ResponseEntity<ApiResponse<SalesOrderDto>> getById(@PathVariable UUID id) {
        SalesOrderDto order = salesOrderService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @GetMapping("/account/{accountId}")
    @Operation(summary = "Commandes d'un compte")
    public ResponseEntity<ApiResponse<List<SalesOrderListDto>>> getByAccount(@PathVariable UUID accountId) {
        List<SalesOrderListDto> orders = salesOrderService.findByAccountId(accountId);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @PostMapping
    @Operation(summary = "Créer une commande")
    public ResponseEntity<ApiResponse<SalesOrderDto>> create(@Valid @RequestBody CreateSalesOrderRequest request) {
        SalesOrderDto order = salesOrderService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(order));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier une commande")
    public ResponseEntity<ApiResponse<SalesOrderDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSalesOrderRequest request) {
        SalesOrderDto order = salesOrderService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une commande")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        salesOrderService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/confirm")
    @Operation(summary = "Confirmer une commande")
    public ResponseEntity<ApiResponse<SalesOrderDto>> confirm(@PathVariable UUID id) {
        SalesOrderDto order = salesOrderService.confirm(id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PatchMapping("/{id}/ship")
    @Operation(summary = "Expédier une commande")
    public ResponseEntity<ApiResponse<SalesOrderDto>> ship(@PathVariable UUID id) {
        SalesOrderDto order = salesOrderService.ship(id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PatchMapping("/{id}/deliver")
    @Operation(summary = "Livrer une commande")
    public ResponseEntity<ApiResponse<SalesOrderDto>> deliver(@PathVariable UUID id) {
        SalesOrderDto order = salesOrderService.deliver(id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Annuler une commande")
    public ResponseEntity<ApiResponse<SalesOrderDto>> cancel(@PathVariable UUID id) {
        SalesOrderDto order = salesOrderService.cancel(id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }
}
