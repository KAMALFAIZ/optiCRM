package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.ProductBatchDTO;
import com.opticrm.delivery.entity.ProductBatch;
import com.opticrm.delivery.service.ProductBatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/batch")
@RequiredArgsConstructor
public class ProductBatchController {

    private final ProductBatchService batchService;

    @PostMapping
    public ResponseEntity<ProductBatchDTO> create(@RequestBody ProductBatchDTO dto) {
        return ResponseEntity.ok(batchService.toDto(batchService.create(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductBatchDTO> update(@PathVariable UUID id, @RequestBody ProductBatchDTO dto) {
        return ResponseEntity.ok(batchService.toDto(batchService.update(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        batchService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<ProductBatchDTO>> getAll() {
        return ResponseEntity.ok(batchService.getAll());
    }

    @GetMapping("/item/{itemId}")
    public ResponseEntity<List<ProductBatchDTO>> getByItem(@PathVariable UUID itemId) {
        return ResponseEntity.ok(batchService.getByItem(itemId));
    }

    /** Lots qui expirent dans les N prochains jours (défaut: 30) */
    @GetMapping("/expiring-soon")
    public ResponseEntity<List<ProductBatchDTO>> getExpiringSoon(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(batchService.getExpiringSoon(days));
    }

    /** Marque les lots périmés et retourne le nombre mis à jour */
    @PostMapping("/mark-expired")
    public ResponseEntity<Map<String, Object>> markExpired() {
        int count = batchService.markExpired();
        return ResponseEntity.ok(Map.of("markedExpired", count));
    }
}
