package com.opticrm.stock.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageMeta;
import com.opticrm.common.dto.PageRequest;
import com.opticrm.stock.dto.StockLevelDto;
import com.opticrm.stock.service.StockLevelService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/stock-levels")
@RequiredArgsConstructor
public class StockLevelController {

    private final StockLevelService stockLevelService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<StockLevelDto>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection,
            @RequestParam(required = false) String warehouseId
    ) {
        PageRequest pageRequest = PageRequest.builder()
                .page(page)
                .perPage(perPage)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        Page<StockLevelDto> result = stockLevelService.list(pageRequest, warehouseId);

        return ResponseEntity.ok(ApiResponse.success(
                result.getContent(),
                PageMeta.from(result)
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<StockLevelDto>> getById(@PathVariable UUID id) {
        StockLevelDto stockLevel = stockLevelService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(stockLevel));
    }

    @GetMapping("/product/{productId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<StockLevelDto>>> getByProduct(@PathVariable UUID productId) {
        List<StockLevelDto> stockLevels = stockLevelService.getByProduct(productId);
        return ResponseEntity.ok(ApiResponse.success(stockLevels));
    }

    @GetMapping("/product/{productId}/warehouse/{warehouseId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<StockLevelDto>> getByProductAndWarehouse(
            @PathVariable UUID productId,
            @PathVariable UUID warehouseId
    ) {
        StockLevelDto stockLevel = stockLevelService.getByProductAndWarehouse(productId, warehouseId);
        return ResponseEntity.ok(ApiResponse.success(stockLevel));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<StockLevelDto>>> getLowStock() {
        List<StockLevelDto> lowStock = stockLevelService.getLowStock();
        return ResponseEntity.ok(ApiResponse.success(lowStock));
    }

    @GetMapping("/needs-reorder")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<StockLevelDto>>> getNeedsReorder() {
        List<StockLevelDto> needsReorder = stockLevelService.getNeedingReorder();
        return ResponseEntity.ok(ApiResponse.success(needsReorder));
    }

    @GetMapping("/product/{productId}/total")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalAvailable(@PathVariable UUID productId) {
        BigDecimal total = stockLevelService.getTotalAvailable(productId);
        return ResponseEntity.ok(ApiResponse.success(total));
    }

    @GetMapping("/check-availability")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<Boolean>> checkAvailability(
            @RequestParam String productId,
            @RequestParam String warehouseId,
            @RequestParam BigDecimal quantity
    ) {
        boolean available = stockLevelService.checkAvailability(
                UUID.fromString(productId),
                UUID.fromString(warehouseId),
                quantity
        );
        return ResponseEntity.ok(ApiResponse.success(available));
    }
}
