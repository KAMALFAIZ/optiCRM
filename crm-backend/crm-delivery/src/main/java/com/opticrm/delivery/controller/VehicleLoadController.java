package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.VehicleLoadDTO;
import com.opticrm.delivery.dto.VehicleLoadDTO.VehicleLoadItemDTO;
import com.opticrm.delivery.dto.VehicleLoadGroupDTO;
import com.opticrm.delivery.dto.VehicleLoadKpiDTO;
import com.opticrm.delivery.entity.VehicleLoad;
import com.opticrm.delivery.entity.VehicleLoadItem;
import com.opticrm.delivery.service.VehicleLoadService;
import com.opticrm.delivery.service.VehicleLoadService.VehicleLoadItemRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/vehicle-load")
@RequiredArgsConstructor
public class VehicleLoadController {

    private final VehicleLoadService vehicleLoadService;

    // ─── Liste principale (filtrage date/zone) ────────────────────────────────

    /**
     * Liste des sessions de chargement filtrées par date et zone.
     * GET /api/v1/delivery/vehicle-load?date=2026-05-04&zone=NORD
     */
    @GetMapping
    public ResponseEntity<List<VehicleLoadDTO>> listLoads(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String zone) {
        return ResponseEntity.ok(
                vehicleLoadService.getLoadsByDateAndZone(date, zone)
                        .stream().map(this::mapToDto).toList()
        );
    }

    // ─── KPI cards ────────────────────────────────────────────────────────────

    @GetMapping("/kpi")
    public ResponseEntity<VehicleLoadKpiDTO> getKpi(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String zone) {
        return ResponseEntity.ok(vehicleLoadService.getKpi(date, zone));
    }

    // ─── Vue groupée par (tournée + dépôt) ───────────────────────────────────

    /**
     * Retourne une ligne par combinaison (tournée + dépôt).
     * Chaque ligne inclut nbArticles, totalQuantite, statut et la liste des sessions détaillées.
     * GET /api/v1/delivery/vehicle-load/grouped?date=2026-05-04&zone=NORD
     */
    @GetMapping("/grouped")
    public ResponseEntity<List<VehicleLoadGroupDTO>> listGrouped(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String zone) {
        return ResponseEntity.ok(vehicleLoadService.getGroupedByDepot(date, zone));
    }

    // ─── Dates disponibles pour le filtre dropdown ────────────────────────────

    @GetMapping("/dates")
    public ResponseEntity<List<Object[]>> getDistinctDatesAndZones() {
        return ResponseEntity.ok(vehicleLoadService.getDistinctDatesAndZones());
    }

    // ─── Par tournée ──────────────────────────────────────────────────────────

    @GetMapping("/tour/{tourId}")
    public ResponseEntity<List<VehicleLoadDTO>> listByTour(@PathVariable UUID tourId) {
        return ResponseEntity.ok(
                vehicleLoadService.getLoadsByTour(tourId)
                        .stream().map(this::mapToDto).toList()
        );
    }

    // ─── Session : CRUD ───────────────────────────────────────────────────────

    /**
     * Crée une session avec ses lignes articles.
     * Body: { deliveryTourId, warehouseFromId, items: [{itemId, quantity, batchId, lotNumber, expiryDate}] }
     */
    @PostMapping
    public ResponseEntity<VehicleLoadDTO> createSession(@RequestBody VehicleLoadDTO dto) {
        // Si existingSessionId fourni : ajoute les items à la session existante
        if (dto.getExistingSessionId() != null && dto.getItems() != null && !dto.getItems().isEmpty()) {
            VehicleLoad session = vehicleLoadService.getSession(dto.getExistingSessionId());
            for (VehicleLoadDTO.VehicleLoadItemDTO item : dto.getItems()) {
                vehicleLoadService.addItem(
                        dto.getExistingSessionId(),
                        item.getItemId(), item.getQuantity(),
                        item.getBatchId(), item.getLotNumber(), item.getExpiryDate()
                );
            }
            return ResponseEntity.ok(mapToDto(vehicleLoadService.getSession(dto.getExistingSessionId())));
        }

        List<VehicleLoadItemRequest> requests = dto.getItems() == null ? List.of() :
                dto.getItems().stream()
                        .map(i -> new VehicleLoadItemRequest(
                                i.getItemId(), i.getQuantity(),
                                i.getBatchId(), i.getLotNumber(), i.getExpiryDate()))
                        .toList();

        VehicleLoad session = vehicleLoadService.createSession(
                dto.getDeliveryTourId(),
                dto.getWarehouseFromId(),
                requests
        );
        return ResponseEntity.ok(mapToDto(session));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleLoadDTO> getSession(@PathVariable UUID id) {
        return ResponseEntity.ok(mapToDto(vehicleLoadService.getSession(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable UUID id) {
        vehicleLoadService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Confirmation ─────────────────────────────────────────────────────────

    @PutMapping("/{id}/confirm")
    public ResponseEntity<VehicleLoadDTO> confirmSession(@PathVariable UUID id) {
        return ResponseEntity.ok(mapToDto(vehicleLoadService.confirmSession(id)));
    }

    @PutMapping("/tour/{tourId}/confirm-all")
    public ResponseEntity<Map<String, Object>> confirmAllForTour(@PathVariable UUID tourId) {
        int count = vehicleLoadService.confirmAllForTour(tourId);
        return ResponseEntity.ok(Map.of(
                "confirmes", count,
                "message", count + " session(s) confirmée(s)"
        ));
    }

    // ─── Lignes articles ──────────────────────────────────────────────────────

    /**
     * Ajoute un article à une session existante.
     * POST /api/v1/delivery/vehicle-load/{sessionId}/items
     */
    @PostMapping("/{sessionId}/items")
    public ResponseEntity<VehicleLoadItemDTO> addItem(
            @PathVariable UUID sessionId,
            @RequestBody VehicleLoadItemDTO dto) {
        VehicleLoadItem item = vehicleLoadService.addItem(
                sessionId, dto.getItemId(), dto.getQuantity(),
                dto.getBatchId(), dto.getLotNumber(), dto.getExpiryDate()
        );
        return ResponseEntity.ok(mapItemToDto(item));
    }

    /**
     * Modifie un article d'une session.
     * PUT /api/v1/delivery/vehicle-load/items/{itemId}
     */
    @PutMapping("/items/{itemId}")
    public ResponseEntity<VehicleLoadItemDTO> updateItem(
            @PathVariable UUID itemId,
            @RequestBody VehicleLoadItemDTO dto) {
        VehicleLoadItem item = vehicleLoadService.updateItem(
                itemId, dto.getQuantity(),
                dto.getBatchId(), dto.getLotNumber(), dto.getExpiryDate()
        );
        return ResponseEntity.ok(mapItemToDto(item));
    }

    /**
     * Supprime un article d'une session.
     * DELETE /api/v1/delivery/vehicle-load/items/{itemId}
     */
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> deleteItem(@PathVariable UUID itemId) {
        vehicleLoadService.deleteItem(itemId);
        return ResponseEntity.noContent().build();
    }

    // ─── Mapping ──────────────────────────────────────────────────────────────

    private VehicleLoadDTO mapToDto(VehicleLoad session) {
        var tour = session.getDeliveryTour();
        return VehicleLoadDTO.builder()
                .id(session.getId())
                .deliveryTourId(tour != null ? tour.getId() : null)
                .tourDate(tour != null ? tour.getTourDate() : null)
                .zone(tour != null ? tour.getZone() : null)
                .representativeId(tour != null ? tour.getRepresentativeId() : null)
                .vehicleId(tour != null ? tour.getVehicleId() : null)
                .loadDate(session.getLoadDate())
                .warehouseFromId(session.getWarehouseFromId())
                .status(session.getStatus() != null ? session.getStatus().name() : null)
                .items(session.getItems() == null ? List.of() :
                        session.getItems().stream().map(this::mapItemToDto).toList())
                .build();
    }

    private VehicleLoadItemDTO mapItemToDto(VehicleLoadItem item) {
        return VehicleLoadItemDTO.builder()
                .id(item.getId())
                .itemId(item.getItemId())
                .quantity(item.getQuantity())
                .batchId(item.getBatchId())
                .lotNumber(item.getLotNumber())
                .expiryDate(item.getExpiryDate())
                .build();
    }
}
