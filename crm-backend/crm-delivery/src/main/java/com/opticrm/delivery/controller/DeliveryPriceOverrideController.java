package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.DeliveryPriceOverrideDTO;
import com.opticrm.delivery.entity.DeliveryPriceOverride;
import com.opticrm.delivery.repository.DeliveryPriceOverrideRepository;
import com.opticrm.delivery.service.DeliveryPriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/price-override")
@RequiredArgsConstructor
public class DeliveryPriceOverrideController {

    private final DeliveryPriceOverrideRepository repository;
    private final DeliveryPriceService priceService;

    @GetMapping
    public ResponseEntity<List<DeliveryPriceOverrideDTO>> list(
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) UUID itemId) {
        List<DeliveryPriceOverride> results;
        if (customerId != null) {
            results = repository.findByCustomerId(customerId);
        } else if (itemId != null) {
            results = repository.findByItemId(itemId);
        } else {
            results = repository.findAll();
        }
        return ResponseEntity.ok(results.stream().map(this::toDto).toList());
    }

    @PostMapping
    public ResponseEntity<DeliveryPriceOverrideDTO> create(@RequestBody DeliveryPriceOverrideDTO dto) {
        DeliveryPriceOverride entity = DeliveryPriceOverride.builder()
            .itemId(dto.getItemId())
            .customerId(dto.getCustomerId())
            .pricingCategoryId(dto.getPricingCategoryId())
            .unitPrice(dto.getUnitPrice())
            .validFrom(dto.getValidFrom())
            .validTo(dto.getValidTo())
            .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
            .notes(dto.getNotes())
            .build();
        return ResponseEntity.ok(toDto(repository.save(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeliveryPriceOverrideDTO> update(
            @PathVariable UUID id, @RequestBody DeliveryPriceOverrideDTO dto) {
        DeliveryPriceOverride entity = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Price override not found"));
        entity.setUnitPrice(dto.getUnitPrice());
        entity.setValidFrom(dto.getValidFrom());
        entity.setValidTo(dto.getValidTo());
        entity.setIsActive(dto.getIsActive());
        entity.setNotes(dto.getNotes());
        return ResponseEntity.ok(toDto(repository.save(entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /delivery/price-override/resolve?customerId=&itemId=
     * Retourne le prix résolu et sa source pour l'app mobile.
     */
    @GetMapping("/resolve")
    public ResponseEntity<Map<String, Object>> resolve(
            @RequestParam UUID customerId,
            @RequestParam UUID itemId) {
        DeliveryPriceService.PriceResolution res = priceService.resolvePrice(customerId, itemId);
        return ResponseEntity.ok(Map.of(
            "customerId", customerId.toString(),
            "itemId", itemId.toString(),
            "unitPrice", res.unitPrice(),
            "source", res.source().name()
        ));
    }

    private DeliveryPriceOverrideDTO toDto(DeliveryPriceOverride e) {
        return DeliveryPriceOverrideDTO.builder()
            .id(e.getId())
            .itemId(e.getItemId())
            .customerId(e.getCustomerId())
            .pricingCategoryId(e.getPricingCategoryId())
            .unitPrice(e.getUnitPrice())
            .validFrom(e.getValidFrom())
            .validTo(e.getValidTo())
            .isActive(e.getIsActive())
            .notes(e.getNotes())
            .build();
    }
}
