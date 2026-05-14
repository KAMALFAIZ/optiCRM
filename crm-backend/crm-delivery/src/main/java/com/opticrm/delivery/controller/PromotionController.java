package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.DeliveryPromotionDTO;
import com.opticrm.delivery.entity.DeliveryLineBonus;
import com.opticrm.delivery.entity.DeliveryPromotion;
import com.opticrm.delivery.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/promotion")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    @GetMapping
    public ResponseEntity<List<DeliveryPromotion>> getAll(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(activeOnly ? promotionService.getActive() : promotionService.getAll());
    }

    @PostMapping
    public ResponseEntity<DeliveryPromotion> create(@RequestBody DeliveryPromotionDTO dto) {
        return ResponseEntity.ok(promotionService.create(fromDto(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeliveryPromotion> update(
            @PathVariable UUID id, @RequestBody DeliveryPromotionDTO dto) {
        return ResponseEntity.ok(promotionService.update(id, fromDto(dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        promotionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** GET /promotion/line/{lineId}/bonuses — bonus appliqués sur une ligne de livraison */
    @GetMapping("/line/{lineId}/bonuses")
    public ResponseEntity<List<Map<String, Object>>> getBonuses(@PathVariable UUID lineId) {
        List<DeliveryLineBonus> bonuses = promotionService.getBonusesForLine(lineId);
        List<Map<String, Object>> result = bonuses.stream().map(b -> {
            Map<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("id",            b.getId().toString());
            row.put("promotionId",   b.getPromotion().getId().toString());
            row.put("promotionName", b.getPromotion().getName());
            row.put("bonusItemId",   b.getBonusItemId().toString());
            row.put("bonusQuantity", b.getBonusQuantity());
            return row;
        }).toList();
        return ResponseEntity.ok(result);
    }

    private DeliveryPromotion fromDto(DeliveryPromotionDTO dto) {
        return DeliveryPromotion.builder()
            .name(dto.getName())
            .description(dto.getDescription())
            .itemId(dto.getItemId())
            .minQuantity(dto.getMinQuantity() != null ? dto.getMinQuantity() : 1)
            .bonusItemId(dto.getBonusItemId())
            .bonusQuantity(dto.getBonusQuantity() != null ? dto.getBonusQuantity() : 1)
            .zone(dto.getZone())
            .validFrom(dto.getValidFrom())
            .validTo(dto.getValidTo())
            .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
            .build();
    }
}
