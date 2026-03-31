package com.opticrm.stock.service;

import com.opticrm.common.dto.PageRequest;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.stock.dto.CreateStockMovementRequest;
import com.opticrm.stock.dto.StockMovementDto;
import com.opticrm.stock.entity.Product;
import com.opticrm.stock.entity.StockLevel;
import com.opticrm.stock.entity.StockMovement;
import com.opticrm.stock.entity.Warehouse;
import com.opticrm.stock.repository.ProductRepository;
import com.opticrm.stock.repository.StockLevelRepository;
import com.opticrm.stock.repository.StockMovementRepository;
import com.opticrm.stock.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockMovementService {

    private final StockMovementRepository movementRepository;
    private final StockLevelRepository stockLevelRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    private static final Map<String, String> MOVEMENT_TYPE_LABELS = new HashMap<>();
    static {
        MOVEMENT_TYPE_LABELS.put("PURCHASE", "Achat");
        MOVEMENT_TYPE_LABELS.put("SALE", "Vente");
        MOVEMENT_TYPE_LABELS.put("ADJUSTMENT", "Ajustement");
        MOVEMENT_TYPE_LABELS.put("RETURN", "Retour");
        MOVEMENT_TYPE_LABELS.put("TRANSFER", "Transfert");
        MOVEMENT_TYPE_LABELS.put("DAMAGE", "Casse/Perte");
        MOVEMENT_TYPE_LABELS.put("INVENTORY", "Inventaire");
    }

    @Transactional(readOnly = true)
    public StockMovementDto getById(UUID id) {
        StockMovement movement = movementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("StockMovement", id));
        return mapToDto(movement);
    }

    @Transactional(readOnly = true)
    public Page<StockMovementDto> list(PageRequest pageRequest, String productId, String warehouseId,
                                       String movementType, Instant startDate, Instant endDate) {
        Page<StockMovement> movements;

        if (productId != null && warehouseId != null) {
            movements = movementRepository.findByProductIdAndWarehouseId(
                    UUID.fromString(productId),
                    UUID.fromString(warehouseId),
                    pageRequest.toPageable("createdAt", Sort.Direction.DESC));
        } else if (productId != null) {
            movements = movementRepository.findByProductId(UUID.fromString(productId),
                    pageRequest.toPageable("createdAt", Sort.Direction.DESC));
        } else if (warehouseId != null) {
            movements = movementRepository.findByWarehouseId(UUID.fromString(warehouseId),
                    pageRequest.toPageable("createdAt", Sort.Direction.DESC));
        } else if (startDate != null && endDate != null) {
            movements = movementRepository.findByDateRange(startDate, endDate,
                    pageRequest.toPageable("createdAt", Sort.Direction.DESC));
        } else if (movementType != null) {
            movements = movementRepository.findByMovementType(movementType,
                    pageRequest.toPageable("createdAt", Sort.Direction.DESC));
        } else {
            movements = movementRepository.findAllWithDetails(
                    pageRequest.toPageable("createdAt", Sort.Direction.DESC));
        }

        return movements.map(this::mapToDto);
    }

    @Transactional
    public StockMovementDto create(CreateStockMovementRequest request) {
        Product product = productRepository.findById(UUID.fromString(request.getProductId()))
                .orElseThrow(() -> new ResourceNotFoundException("Product", request.getProductId()));

        Warehouse warehouse = warehouseRepository.findById(UUID.fromString(request.getWarehouseId()))
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", request.getWarehouseId()));

        // Get or create stock level
        StockLevel stockLevel = stockLevelRepository
                .findByProductIdAndWarehouseId(product.getId(), warehouse.getId())
                .orElseGet(() -> {
                    StockLevel newLevel = StockLevel.builder()
                            .product(product)
                            .warehouse(warehouse)
                            .quantityOnHand(BigDecimal.ZERO)
                            .quantityReserved(BigDecimal.ZERO)
                            .quantityOnOrder(BigDecimal.ZERO)
                            .averageCost(product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO)
                            .build();
                    return stockLevelRepository.save(newLevel);
                });

        // Validate movement
        validateMovement(stockLevel, request);

        // Update stock level
        BigDecimal newQuantity = stockLevel.getQuantityOnHand().add(request.getQuantity());
        stockLevel.setQuantityOnHand(newQuantity);

        // Update average cost for purchases
        if (StockMovement.TYPE_PURCHASE.equals(request.getMovementType()) && request.getUnitCost() != null) {
            updateAverageCost(stockLevel, request.getQuantity(), request.getUnitCost());
        }

        stockLevelRepository.save(stockLevel);

        // Create movement record
        StockMovement movement = StockMovement.builder()
                .product(product)
                .warehouse(warehouse)
                .movementType(request.getMovementType())
                .quantity(request.getQuantity())
                .unitCost(request.getUnitCost())
                .referenceType(request.getReferenceType())
                .referenceId(request.getReferenceId() != null ? UUID.fromString(request.getReferenceId()) : null)
                .quantityAfter(newQuantity)
                .notes(request.getNotes())
                .build();

        movement = movementRepository.save(movement);
        log.info("Created stock movement: {} {} for product {} in warehouse {}",
                request.getMovementType(), request.getQuantity(), product.getCode(), warehouse.getCode());

        return mapToDto(movement);
    }

    @Transactional
    public StockMovementDto createAdjustment(UUID productId, UUID warehouseId,
                                             BigDecimal newQuantity, String notes) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", warehouseId));

        // Get current stock level
        StockLevel stockLevel = stockLevelRepository
                .findByProductIdAndWarehouseId(productId, warehouseId)
                .orElseGet(() -> {
                    StockLevel newLevel = StockLevel.builder()
                            .product(product)
                            .warehouse(warehouse)
                            .quantityOnHand(BigDecimal.ZERO)
                            .quantityReserved(BigDecimal.ZERO)
                            .quantityOnOrder(BigDecimal.ZERO)
                            .averageCost(product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO)
                            .build();
                    return stockLevelRepository.save(newLevel);
                });

        // Calculate adjustment quantity
        BigDecimal adjustment = newQuantity.subtract(stockLevel.getQuantityOnHand());

        // Update stock level
        stockLevel.setQuantityOnHand(newQuantity);
        stockLevelRepository.save(stockLevel);

        // Create movement record
        StockMovement movement = StockMovement.builder()
                .product(product)
                .warehouse(warehouse)
                .movementType(StockMovement.TYPE_ADJUSTMENT)
                .quantity(adjustment)
                .unitCost(stockLevel.getAverageCost())
                .referenceType(StockMovement.REF_MANUAL)
                .quantityAfter(newQuantity)
                .notes(notes != null ? notes : "Ajustement manuel")
                .build();

        movement = movementRepository.save(movement);
        log.info("Created stock adjustment for product {} in warehouse {}: {} -> {}",
                product.getCode(), warehouse.getCode(), stockLevel.getQuantityOnHand().subtract(adjustment), newQuantity);

        return mapToDto(movement);
    }

    @Transactional(readOnly = true)
    public List<StockMovementDto> getByReference(String referenceType, UUID referenceId) {
        return movementRepository.findByReference(referenceType, referenceId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    private void validateMovement(StockLevel stockLevel, CreateStockMovementRequest request) {
        // For outbound movements, check if we have enough stock
        if (request.getQuantity().compareTo(BigDecimal.ZERO) < 0) {
            BigDecimal available = stockLevel.getQuantityAvailable();
            BigDecimal required = request.getQuantity().abs();

            if (available.compareTo(required) < 0) {
                throw new IllegalStateException(
                        String.format("Stock insuffisant. Disponible: %s, Requis: %s",
                                available, required));
            }
        }
    }

    private void updateAverageCost(StockLevel stockLevel, BigDecimal quantity, BigDecimal unitCost) {
        BigDecimal currentTotal = stockLevel.getQuantityOnHand().multiply(stockLevel.getAverageCost());
        BigDecimal newTotal = quantity.multiply(unitCost);
        BigDecimal totalQuantity = stockLevel.getQuantityOnHand().add(quantity);

        if (totalQuantity.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal newAverageCost = currentTotal.add(newTotal)
                    .divide(totalQuantity, 2, java.math.RoundingMode.HALF_UP);
            stockLevel.setAverageCost(newAverageCost);
        }
    }

    // Mapping methods
    private StockMovementDto mapToDto(StockMovement movement) {
        StockMovementDto.StockMovementDtoBuilder builder = StockMovementDto.builder()
                .id(movement.getId().toString())
                .product(StockMovementDto.ProductSummary.builder()
                        .id(movement.getProduct().getId().toString())
                        .code(movement.getProduct().getCode())
                        .name(movement.getProduct().getName())
                        .build())
                .warehouse(StockMovementDto.WarehouseSummary.builder()
                        .id(movement.getWarehouse().getId().toString())
                        .code(movement.getWarehouse().getCode())
                        .name(movement.getWarehouse().getName())
                        .build())
                .movementType(movement.getMovementType())
                .movementTypeLabel(MOVEMENT_TYPE_LABELS.getOrDefault(movement.getMovementType(), movement.getMovementType()))
                .quantity(movement.getQuantity())
                .unitCost(movement.getUnitCost())
                .referenceType(movement.getReferenceType())
                .referenceId(movement.getReferenceId() != null ? movement.getReferenceId().toString() : null)
                .quantityAfter(movement.getQuantityAfter())
                .notes(movement.getNotes())
                .createdAt(movement.getCreatedAt());

        if (movement.getCreatedBy() != null) {
            builder.createdBy(StockMovementDto.UserSummary.builder()
                    .id(movement.getCreatedBy().getId().toString())
                    .fullName(movement.getCreatedBy().getFullName())
                    .build());
        }

        return builder.build();
    }
}
