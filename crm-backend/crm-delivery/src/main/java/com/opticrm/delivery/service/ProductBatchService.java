package com.opticrm.delivery.service;

import com.opticrm.delivery.dto.ProductBatchDTO;
import com.opticrm.delivery.entity.ProductBatch;
import com.opticrm.delivery.repository.ProductBatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ProductBatchService {

    private final ProductBatchRepository batchRepository;

    public ProductBatch create(ProductBatchDTO dto) {
        ProductBatch batch = ProductBatch.builder()
            .itemId(dto.getItemId())
            .batchNumber(dto.getBatchNumber())
            .expiryDate(dto.getExpiryDate())
            .quantity(dto.getQuantity() != null ? dto.getQuantity() : 0)
            .warehouseId(dto.getWarehouseId())
            .status(ProductBatch.BatchStatus.ACTIVE)
            .notes(dto.getNotes())
            .build();
        return batchRepository.save(batch);
    }

    public ProductBatch update(UUID id, ProductBatchDTO dto) {
        ProductBatch batch = batchRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Lot introuvable"));
        batch.setBatchNumber(dto.getBatchNumber());
        batch.setExpiryDate(dto.getExpiryDate());
        batch.setQuantity(dto.getQuantity() != null ? dto.getQuantity() : batch.getQuantity());
        batch.setWarehouseId(dto.getWarehouseId());
        batch.setNotes(dto.getNotes());
        if (dto.getStatus() != null) batch.setStatus(ProductBatch.BatchStatus.valueOf(dto.getStatus()));
        return batchRepository.save(batch);
    }

    public void delete(UUID id) {
        batchRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<ProductBatchDTO> getAll() {
        return batchRepository.findAll().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductBatchDTO> getByItem(UUID itemId) {
        return batchRepository.findByItemId(itemId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    /** Lots actifs qui expirent dans les 30 prochains jours */
    @Transactional(readOnly = true)
    public List<ProductBatchDTO> getExpiringSoon(int days) {
        LocalDate deadline = LocalDate.now().plusDays(days);
        return batchRepository.findExpiringBefore(deadline).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    /** Marque automatiquement les lots périmés */
    public int markExpired() {
        List<ProductBatch> expired = batchRepository.findExpired(LocalDate.now());
        expired.forEach(b -> b.setStatus(ProductBatch.BatchStatus.EXPIRED));
        batchRepository.saveAll(expired);
        log.info("{} lots marqués périmés", expired.size());
        return expired.size();
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    public ProductBatchDTO toDto(ProductBatch b) {
        Integer daysUntil = null;
        String alert = "OK";
        if (b.getExpiryDate() != null) {
            long days = ChronoUnit.DAYS.between(LocalDate.now(), b.getExpiryDate());
            daysUntil = (int) days;
            if (days < 0)        alert = "EXPIRED";
            else if (days <= 7)  alert = "CRITICAL";
            else if (days <= 30) alert = "WARNING";
            else                 alert = "OK";
        }
        return ProductBatchDTO.builder()
            .id(b.getId())
            .itemId(b.getItemId())
            .batchNumber(b.getBatchNumber())
            .expiryDate(b.getExpiryDate())
            .quantity(b.getQuantity())
            .warehouseId(b.getWarehouseId())
            .status(b.getStatus() != null ? b.getStatus().name() : null)
            .notes(b.getNotes())
            .createdAt(b.getCreatedAt())
            .daysUntilExpiry(daysUntil)
            .expiryAlert(alert)
            .build();
    }
}
