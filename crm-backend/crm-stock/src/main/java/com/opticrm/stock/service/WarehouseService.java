package com.opticrm.stock.service;

import com.opticrm.common.exception.DuplicateEntryException;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.stock.dto.CreateWarehouseRequest;
import com.opticrm.stock.dto.WarehouseDto;
import com.opticrm.stock.entity.Warehouse;
import com.opticrm.stock.repository.StockLevelRepository;
import com.opticrm.stock.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final StockLevelRepository stockLevelRepository;

    @Transactional(readOnly = true)
    public WarehouseDto getById(UUID id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", id));
        return mapToDto(warehouse, true);
    }

    @Transactional(readOnly = true)
    public List<WarehouseDto> list() {
        return warehouseRepository.findAllOrdered()
                .stream()
                .map(w -> mapToDto(w, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WarehouseDto> listActive() {
        return warehouseRepository.findByIsActiveTrue()
                .stream()
                .map(w -> mapToDto(w, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WarehouseDto> search(String searchTerm) {
        return warehouseRepository.search(searchTerm)
                .stream()
                .map(w -> mapToDto(w, false))
                .collect(Collectors.toList());
    }

    @Transactional
    public WarehouseDto create(CreateWarehouseRequest request) {
        // Check for duplicate code
        if (warehouseRepository.existsByCode(request.getCode())) {
            throw new DuplicateEntryException("code", request.getCode());
        }

        Warehouse warehouse = Warehouse.builder()
                .code(request.getCode())
                .name(request.getName())
                .addressStreet(request.getAddressStreet())
                .addressCity(request.getAddressCity())
                .addressPostalCode(request.getAddressPostalCode())
                .addressCountry(request.getAddressCountry())
                .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        // If this is set as default, unset other defaults
        if (Boolean.TRUE.equals(warehouse.getIsDefault())) {
            warehouseRepository.findDefault().ifPresent(existing -> {
                existing.setIsDefault(false);
                warehouseRepository.save(existing);
            });
        }

        warehouse = warehouseRepository.save(warehouse);
        log.info("Created warehouse: {} ({})", warehouse.getName(), warehouse.getCode());

        return mapToDto(warehouse, false);
    }

    @Transactional
    public WarehouseDto update(UUID id, CreateWarehouseRequest request) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", id));

        // Check for duplicate code (excluding current)
        if (request.getCode() != null && !request.getCode().equals(warehouse.getCode())) {
            if (warehouseRepository.existsByCode(request.getCode())) {
                throw new DuplicateEntryException("code", request.getCode());
            }
            warehouse.setCode(request.getCode());
        }

        if (request.getName() != null) warehouse.setName(request.getName());
        if (request.getAddressStreet() != null) warehouse.setAddressStreet(request.getAddressStreet());
        if (request.getAddressCity() != null) warehouse.setAddressCity(request.getAddressCity());
        if (request.getAddressPostalCode() != null) warehouse.setAddressPostalCode(request.getAddressPostalCode());
        if (request.getAddressCountry() != null) warehouse.setAddressCountry(request.getAddressCountry());
        if (request.getIsActive() != null) warehouse.setIsActive(request.getIsActive());

        // Handle default status
        if (request.getIsDefault() != null && request.getIsDefault() && !warehouse.getIsDefault()) {
            // Unset other defaults
            warehouseRepository.findDefault().ifPresent(existing -> {
                existing.setIsDefault(false);
                warehouseRepository.save(existing);
            });
            warehouse.setIsDefault(true);
        }

        warehouse = warehouseRepository.save(warehouse);
        log.info("Updated warehouse: {}", id);

        return mapToDto(warehouse, true);
    }

    @Transactional
    public void delete(UUID id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", id));

        // Check if warehouse has stock
        long productCount = stockLevelRepository.countProductsInWarehouse(id);
        if (productCount > 0) {
            throw new IllegalStateException("Impossible de supprimer l'entrepôt car il contient du stock pour " + productCount + " produit(s)");
        }

        warehouseRepository.delete(warehouse);
        log.info("Deleted warehouse: {}", id);
    }

    @Transactional
    public WarehouseDto setDefault(UUID id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", id));

        // Unset other defaults
        warehouseRepository.findDefault().ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                existing.setIsDefault(false);
                warehouseRepository.save(existing);
            }
        });

        warehouse.setIsDefault(true);
        warehouse = warehouseRepository.save(warehouse);
        log.info("Set warehouse as default: {}", id);

        return mapToDto(warehouse, false);
    }

    // Mapping methods
    private WarehouseDto mapToDto(Warehouse warehouse, boolean includeStats) {
        WarehouseDto.WarehouseDtoBuilder builder = WarehouseDto.builder()
                .id(warehouse.getId().toString())
                .code(warehouse.getCode())
                .name(warehouse.getName())
                .addressStreet(warehouse.getAddressStreet())
                .addressCity(warehouse.getAddressCity())
                .addressPostalCode(warehouse.getAddressPostalCode())
                .addressCountry(warehouse.getAddressCountry())
                .fullAddress(warehouse.getFullAddress())
                .isDefault(warehouse.getIsDefault())
                .isActive(warehouse.getIsActive())
                .createdAt(warehouse.getCreatedAt());

        if (includeStats) {
            long productCount = stockLevelRepository.countProductsInWarehouse(warehouse.getId());
            BigDecimal totalValue = stockLevelRepository.getTotalValueByWarehouse(warehouse.getId());

            builder.productCount(productCount);
            builder.totalValue(totalValue != null ? totalValue : BigDecimal.ZERO);
        }

        return builder.build();
    }
}
