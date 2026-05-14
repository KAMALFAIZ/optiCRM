package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.VehicleUnloadDTO;
import com.opticrm.delivery.entity.VehicleUnload;
import com.opticrm.delivery.entity.VehicleUnloadItem;
import com.opticrm.delivery.service.VehicleUnloadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/delivery/unload")
@RequiredArgsConstructor
public class VehicleUnloadController {

    private final VehicleUnloadService vehicleUnloadService;

    /** Génère (ou regénère) le déchargement pour une tournée */
    @PostMapping("/tour/{tourId}/generate")
    public ResponseEntity<VehicleUnloadDTO> generate(@PathVariable UUID tourId) {
        VehicleUnload unload = vehicleUnloadService.generateForTour(tourId);
        return ResponseEntity.ok(mapToDto(unload));
    }

    /** Récupère le déchargement existant d'une tournée */
    @GetMapping("/tour/{tourId}")
    public ResponseEntity<VehicleUnloadDTO> getByTour(@PathVariable UUID tourId) {
        return vehicleUnloadService.findByTour(tourId)
            .map(u -> ResponseEntity.ok(mapToDto(u)))
            .orElse(ResponseEntity.notFound().build());
    }

    /** Confirme le déchargement (magasinier) */
    @PostMapping("/{unloadId}/confirm")
    public ResponseEntity<VehicleUnloadDTO> confirm(
            @PathVariable UUID unloadId,
            @RequestBody Map<String, Object> body) {
        UUID confirmedBy = body.get("confirmedBy") != null
            ? UUID.fromString((String) body.get("confirmedBy")) : null;

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items =
            (List<Map<String, Object>>) body.getOrDefault("items", List.of());

        VehicleUnload confirmed = vehicleUnloadService.confirm(unloadId, confirmedBy, items);
        return ResponseEntity.ok(mapToDto(confirmed));
    }

    // ─── Mapping ──────────────────────────────────────────────────────────────

    private VehicleUnloadDTO mapToDto(VehicleUnload u) {
        List<VehicleUnloadDTO.VehicleUnloadItemDTO> itemDtos = new ArrayList<>();
        if (u.getItems() != null) {
            for (VehicleUnloadItem i : u.getItems()) {
                itemDtos.add(VehicleUnloadDTO.VehicleUnloadItemDTO.builder()
                    .id(i.getId())
                    .itemId(i.getItemId())
                    .quantityLoaded(i.getQuantityLoaded())
                    .quantitySold(i.getQuantitySold())
                    .quantityReturned(i.getQuantityReturned())
                    .quantityUnloaded(i.getQuantityUnloaded())
                    .build());
            }
        }
        return VehicleUnloadDTO.builder()
            .id(u.getId())
            .deliveryTourId(u.getDeliveryTourId())
            .unloadDate(u.getUnloadDate())
            .status(u.getStatus() != null ? u.getStatus().toString() : null)
            .notes(u.getNotes())
            .confirmedBy(u.getConfirmedBy())
            .confirmedAt(u.getConfirmedAt())
            .items(itemDtos)
            .build();
    }
}
