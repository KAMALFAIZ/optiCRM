package com.opticrm.stock.service;

import com.opticrm.common.dto.PageRequest;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.stock.dto.StockLevelDto;
import com.opticrm.stock.entity.Product;
import com.opticrm.stock.entity.StockLevel;
import com.opticrm.stock.entity.Warehouse;
import com.opticrm.stock.repository.ProductRepository;
import com.opticrm.stock.repository.StockLevelRepository;
import com.opticrm.stock.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockLevelService {

    private final StockLevelRepository stockLevelRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    @Transactional(readOnly = true)
    public StockLevelDto getById(UUID id) {
        StockLevel stockLevel = stockLevelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("StockLevel", id));
        return mapToDto(stockLevel);
    }

    @Transactional(readOnly = true)
    public Page<StockLevelDto> list(PageRequest pageRequest, String warehouseId) {
        Page<StockLevel> levels;

        if (warehouseId != null) {
            levels = stockLevelRepository.findByWarehouseId(UUID.fromString(warehouseId),
                    pageRequest.toPageable("product.name", Sort.Direction.ASC));
        } else {
            levels = stockLevelRepository.findAllWithDetails(
                    pageRequest.toPageable("product.name", Sort.Direction.ASC));
        }

        return levels.map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public List<StockLevelDto> getByProduct(UUID productId) {
        return stockLevelRepository.findByProductId(productId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StockLevelDto getByProductAndWarehouse(UUID productId, UUID warehouseId) {
        StockLevel stockLevel = stockLevelRepository.findByProductIdAndWarehouseId(productId, warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("StockLevel for product " + productId + " in warehouse " + warehouseId));
        return mapToDto(stockLevel);
    }

    @Transactional(readOnly = true)
    public List<StockLevelDto> getLowStock() {
        return stockLevelRepository.findLowStock()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StockLevelDto> getNeedingReorder() {
        return stockLevelRepository.findNeedingReorder()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public StockLevelDto initializeStock(UUID productId, UUID warehouseId, BigDecimal initialQuantity) {
        // Check if stock level already exists
        if (stockLevelRepository.findByProductIdAndWarehouseId(productId, warehouseId).isPresent()) {
            throw new IllegalStateException("Stock level already exists for this product and warehouse");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", warehouseId));

        StockLevel stockLevel = StockLevel.builder()
                .product(product)
                .warehouse(warehouse)
                .quantityOnHand(initialQuantity != null ? initialQuantity : BigDecimal.ZERO)
                .quantityReserved(BigDecimal.ZERO)
                .quantityOnOrder(BigDecimal.ZERO)
                .averageCost(product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO)
                .build();

        stockLevel = stockLevelRepository.save(stockLevel);
        log.info("Initialized stock for product {} in warehouse {}: {}", productId, warehouseId, initialQuantity);

        return mapToDto(stockLevel);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalAvailable(UUID productId) {
        BigDecimal total = stockLevelRepository.getTotalQuantityOnHand(productId);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public boolean checkAvailability(UUID productId, UUID warehouseId, BigDecimal requiredQuantity) {
        return stockLevelRepository.findByProductIdAndWarehouseId(productId, warehouseId)
                .map(sl -> sl.getQuantityAvailable().compareTo(requiredQuantity) >= 0)
                .orElse(false);
    }

    // Mapping methods
    private StockLevelDto mapToDto(StockLevel stockLevel) {
        String stockStatus = determineStockStatus(stockLevel);

        return StockLevelDto.builder()
                .id(stockLevel.getId().toString())
                .product(StockLevelDto.ProductSummary.builder()
                        .id(stockLevel.getProduct().getId().toString())
                        .code(stockLevel.getProduct().getCode())
                        .name(stockLevel.getProduct().getName())
                        .unitOfMeasure(stockLevel.getProduct().getUnitOfMeasure())
                        .minStockLevel(stockLevel.getProduct().getMinStockLevel())
                        .reorderLevel(stockLevel.getProduct().getReorderLevel())
                        .build())
                .warehouse(StockLevelDto.WarehouseSummary.builder()
                        .id(stockLevel.getWarehouse().getId().toString())
                        .code(stockLevel.getWarehouse().getCode())
                        .name(stockLevel.getWarehouse().getName())
                        .build())
                .quantityOnHand(stockLevel.getQuantityOnHand())
                .quantityReserved(stockLevel.getQuantityReserved())
                .quantityAvailable(stockLevel.getQuantityAvailable())
                .quantityOnOrder(stockLevel.getQuantityOnOrder())
                .averageCost(stockLevel.getAverageCost())
                .totalValue(stockLevel.getTotalValue())
                .lastCountDate(stockLevel.getLastCountDate())
                .updatedAt(stockLevel.getUpdatedAt())
                .isLowStock(stockLevel.isLowStock())
                .needsReorder(stockLevel.needsReorder())
                .stockStatus(stockStatus)
                .build();
    }

    private String determineStockStatus(StockLevel stockLevel) {
        BigDecimal available = stockLevel.getQuantityAvailable();
        Product product = stockLevel.getProduct();

        if (available.compareTo(BigDecimal.ZERO) <= 0) {
            return "OUT_OF_STOCK";
        }

        if (product.getMinStockLevel() != null && available.compareTo(product.getMinStockLevel()) <= 0) {
            return "CRITICAL";
        }

        if (product.getReorderLevel() != null && available.compareTo(product.getReorderLevel()) <= 0) {
            return "LOW";
        }

        return "OK";
    }
}
