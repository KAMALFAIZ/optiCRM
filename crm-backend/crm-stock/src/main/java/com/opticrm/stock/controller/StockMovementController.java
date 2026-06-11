package com.opticrm.stock.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageMeta;
import com.opticrm.common.dto.PageRequest;
import com.opticrm.stock.dto.CreateStockMovementRequest;
import com.opticrm.stock.dto.StockMovementDto;
import com.opticrm.stock.service.StockMovementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/stock-movements")
@RequiredArgsConstructor
public class StockMovementController {

    private final StockMovementService movementService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<StockMovementDto>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @RequestParam(required = false) String productId,
            @RequestParam(required = false) String warehouseId,
            @RequestParam(required = false) String movementType,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate
    ) {
        PageRequest pageRequest = PageRequest.builder()
                .page(page)
                .perPage(perPage)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        Page<StockMovementDto> result = movementService.list(pageRequest, productId, warehouseId, movementType, startDate, endDate);

        return ResponseEntity.ok(ApiResponse.success(
                result.getContent(),
                PageMeta.from(result)
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<StockMovementDto>> getById(@PathVariable UUID id) {
        StockMovementDto movement = movementService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(movement));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<StockMovementDto>> create(
            @Valid @RequestBody CreateStockMovementRequest request
    ) {
        StockMovementDto movement = movementService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(movement));
    }

    @PostMapping("/adjustment")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<StockMovementDto>> createAdjustment(
            @RequestParam String productId,
            @RequestParam String warehouseId,
            @RequestParam BigDecimal newQuantity,
            @RequestParam(required = false) String notes
    ) {
        StockMovementDto movement = movementService.createAdjustment(
                UUID.fromString(productId),
                UUID.fromString(warehouseId),
                newQuantity,
                notes
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(movement));
    }

    @GetMapping("/by-reference")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<StockMovementDto>>> getByReference(
            @RequestParam String referenceType,
            @RequestParam String referenceId
    ) {
        List<StockMovementDto> movements = movementService.getByReference(referenceType, UUID.fromString(referenceId));
        return ResponseEntity.ok(ApiResponse.success(movements));
    }
}
