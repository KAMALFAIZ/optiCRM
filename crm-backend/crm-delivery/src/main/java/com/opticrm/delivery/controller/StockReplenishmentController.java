package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.StockReplenishmentDTO;
import com.opticrm.delivery.dto.VehicleLoadDTO;
import com.opticrm.delivery.entity.StockReplenishment;
import com.opticrm.delivery.entity.StockReplenishmentItem;
import com.opticrm.delivery.entity.VehicleLoad;
import com.opticrm.delivery.entity.VehicleLoadItem;
import com.opticrm.delivery.service.StockReplenishmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/stock-replenishment")
@RequiredArgsConstructor
public class StockReplenishmentController {

    private final StockReplenishmentService stockReplenishmentService;

    @PostMapping
    public ResponseEntity<StockReplenishmentDTO> createReplenishment(@RequestBody StockReplenishmentDTO dto) {
        List<StockReplenishmentItem> items = dto.getItems().stream()
                .map(itemDto -> StockReplenishmentItem.builder()
                        .itemId(itemDto.getItemId())
                        .quantity(itemDto.getQuantity())
                        .notes(itemDto.getNotes())
                        .build())
                .toList();

        StockReplenishment replenishment = stockReplenishmentService.createReplenishment(
                StockReplenishment.SourceType.valueOf(dto.getSourceType()),
                dto.getSourceId(),
                StockReplenishment.TargetType.valueOf(dto.getTargetType()),
                dto.getTargetId(),
                StockReplenishment.Motive.valueOf(dto.getMotive()),
                items
        );
        return ResponseEntity.ok(mapToDto(replenishment));
    }

    @GetMapping
    public ResponseEntity<List<StockReplenishmentDTO>> listReplenishments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String motive) {

        List<StockReplenishment> replenishments;
        if (motive != null && !motive.isBlank()) {
            try {
                replenishments = stockReplenishmentService.listReplenishmentsByMotive(
                        StockReplenishment.Motive.valueOf(motive.toUpperCase()));
            } catch (IllegalArgumentException e) {
                replenishments = stockReplenishmentService.listAllReplenishments();
            }
        } else if (status != null && !status.isBlank()) {
            try {
                replenishments = stockReplenishmentService.listByStatus(
                        StockReplenishment.ReplenishmentStatus.valueOf(status.toUpperCase()));
            } catch (IllegalArgumentException e) {
                replenishments = stockReplenishmentService.listAllReplenishments();
            }
        } else {
            replenishments = stockReplenishmentService.listAllReplenishments();
        }
        return ResponseEntity.ok(replenishments.stream().map(this::mapToDto).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockReplenishmentDTO> getReplenishment(@PathVariable UUID id) {
        StockReplenishment replenishment = stockReplenishmentService.getReplenishment(id);
        return ResponseEntity.ok(mapToDto(replenishment));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Void> approveReplenishment(
            @PathVariable UUID id,
            @RequestParam UUID approvedByUserId) {
        stockReplenishmentService.approveReplenishment(id, approvedByUserId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/apply")
    public ResponseEntity<Void> applyReplenishment(@PathVariable UUID id) {
        stockReplenishmentService.applyReplenishment(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Transfère les articles d'un réapprovisionnement APPROVED vers une session VehicleLoad.
     * Si targetType=DELIVERY, la tournée cible est lue depuis le réappro.
     * Sinon, passer tourId en paramètre.
     */
    @PostMapping("/{id}/transfer-to-load")
    public ResponseEntity<VehicleLoadDTO> transferToLoad(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID tourId) {
        VehicleLoad session = stockReplenishmentService.transferToLoad(id, tourId);
        return ResponseEntity.ok(mapSessionToDto(session));
    }

    private StockReplenishmentDTO mapToDto(StockReplenishment replenishment) {
        return StockReplenishmentDTO.builder()
                .id(replenishment.getId())
                .sourceType(replenishment.getSourceType().toString())
                .sourceId(replenishment.getSourceId())
                .targetType(replenishment.getTargetType().toString())
                .targetId(replenishment.getTargetId())
                .motive(replenishment.getMotive().toString())
                .requestDate(replenishment.getRequestDate())
                .status(replenishment.getStatus().toString())
                .approvedBy(replenishment.getApprovedBy())
                .approvalDate(replenishment.getApprovalDate())
                .build();
    }

    private VehicleLoadDTO mapSessionToDto(VehicleLoad session) {
        var tour = session.getDeliveryTour();
        return VehicleLoadDTO.builder()
                .id(session.getId())
                .deliveryTourId(tour != null ? tour.getId() : null)
                .tourDate(tour != null ? tour.getTourDate() : null)
                .warehouseFromId(session.getWarehouseFromId())
                .status(session.getStatus() != null ? session.getStatus().name() : null)
                .items(session.getItems() == null ? List.of() :
                        session.getItems().stream().map(i -> VehicleLoadDTO.VehicleLoadItemDTO.builder()
                                .id(i.getId()).itemId(i.getItemId()).quantity(i.getQuantity()).build()).toList())
                .build();
    }
}
