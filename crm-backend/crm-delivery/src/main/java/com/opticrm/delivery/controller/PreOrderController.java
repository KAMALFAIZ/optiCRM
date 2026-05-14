package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.PreOrderDTO;
import com.opticrm.delivery.entity.PreOrder;
import com.opticrm.delivery.entity.PreOrderItem;
import com.opticrm.delivery.service.PreOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/pre-order")
@RequiredArgsConstructor
public class PreOrderController {

    private final PreOrderService preOrderService;

    @PostMapping
    public ResponseEntity<PreOrderDTO> create(@RequestBody PreOrderDTO dto) {
        return ResponseEntity.ok(toDto(preOrderService.create(dto)));
    }

    @GetMapping("/tour/{tourId}")
    public ResponseEntity<List<PreOrderDTO>> getByTour(@PathVariable UUID tourId) {
        return ResponseEntity.ok(preOrderService.getByTour(tourId).stream().map(this::toDto).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PreOrderDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(toDto(preOrderService.getById(id)));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<PreOrderDTO> confirm(@PathVariable UUID id) {
        return ResponseEntity.ok(toDto(preOrderService.confirm(id)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<PreOrderDTO> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(toDto(preOrderService.cancel(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        preOrderService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Commandes prévisionnelles sans tournée — en attente de planification */
    @GetMapping("/pending-unscheduled")
    public ResponseEntity<List<PreOrderDTO>> getPendingUnscheduled() {
        return ResponseEntity.ok(preOrderService.getPendingUnscheduled().stream().map(this::toDto).toList());
    }

    /** Commandes actives pour un client — pour préparer la prochaine visite */
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<PreOrderDTO>> getActiveByCustomer(@PathVariable UUID customerId) {
        return ResponseEntity.ok(preOrderService.getActiveByCustomer(customerId).stream().map(this::toDto).toList());
    }

    /** Rattacher une commande prévisionnelle à une tournée */
    @PutMapping("/{id}/assign-tour/{tourId}")
    public ResponseEntity<PreOrderDTO> assignToTour(@PathVariable UUID id, @PathVariable UUID tourId) {
        return ResponseEntity.ok(toDto(preOrderService.assignToTour(id, tourId)));
    }

    /** Demande de réapprovisionnement consolidée depuis les commandes confirmées */
    @GetMapping("/replenishment-demand")
    public ResponseEntity<List<Map<String, Object>>> getReplenishmentDemand() {
        return ResponseEntity.ok(preOrderService.buildReplenishmentDemand());
    }

    /** Commandes d'une tournée triées par visit_order */
    @GetMapping("/tour/{tourId}/ordered")
    public ResponseEntity<List<PreOrderDTO>> getByTourOrdered(@PathVariable UUID tourId) {
        return ResponseEntity.ok(preOrderService.getByTourOrdered(tourId).stream().map(this::toDto).toList());
    }

    /** Appliquer un ordre de visite manuel (liste d'IDs dans l'ordre souhaité) */
    @PutMapping("/tour/{tourId}/sequence")
    public ResponseEntity<List<PreOrderDTO>> applyVisitOrder(
            @PathVariable UUID tourId,
            @RequestBody List<UUID> orderedIds) {
        return ResponseEntity.ok(preOrderService.applyVisitOrder(tourId, orderedIds).stream().map(this::toDto).toList());
    }

    /** Séquencement automatique nearest-neighbour basé sur GPS des clients */
    @PostMapping("/tour/{tourId}/auto-sequence")
    public ResponseEntity<List<PreOrderDTO>> autoSequence(@PathVariable UUID tourId) {
        return ResponseEntity.ok(preOrderService.autoSequence(tourId).stream().map(this::toDto).toList());
    }

    private PreOrderDTO toDto(PreOrder o) {
        List<PreOrderDTO.PreOrderItemDTO> items = new ArrayList<>();
        if (o.getItems() != null) {
            for (PreOrderItem i : o.getItems()) {
                items.add(PreOrderDTO.PreOrderItemDTO.builder()
                    .id(i.getId())
                    .itemId(i.getItemId())
                    .quantityOrdered(i.getQuantityOrdered())
                    .quantityConfirmed(i.getQuantityConfirmed())
                    .unitPrice(i.getUnitPrice())
                    .build());
            }
        }
        return PreOrderDTO.builder()
            .id(o.getId())
            .deliveryTourId(o.getDeliveryTourId())
            .customerId(o.getCustomerId())
            .scheduledDate(o.getScheduledDate())
            .status(o.getStatus() != null ? o.getStatus().name() : null)
            .notes(o.getNotes())
            .createdAt(o.getCreatedAt())
            .visitOrder(o.getVisitOrder())
            .items(items)
            .build();
    }
}
