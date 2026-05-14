package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.DeliveryTourDTO;
import com.opticrm.delivery.entity.DeliveryTour;
import com.opticrm.delivery.service.DeliveryTourService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/tour")
@RequiredArgsConstructor
public class DeliveryTourController {

    private final DeliveryTourService deliveryTourService;

    @PostMapping
    public ResponseEntity<DeliveryTourDTO> createTour(@RequestBody DeliveryTourDTO dto) {
        DeliveryTour tour = deliveryTourService.createTour(
                dto.getTourDate(),
                dto.getRepresentativeId(),
                dto.getVehicleId(),
                dto.getZone()
        );
        return ResponseEntity.ok(mapToDto(tour));
    }

    @GetMapping
    public ResponseEntity<List<DeliveryTourDTO>> listTours(
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) String status) {

        List<DeliveryTour> tours;
        if (date != null) {
            tours = deliveryTourService.listToursByDate(date);
        } else if (status != null && !status.isBlank()) {
            try {
                tours = deliveryTourService.listToursByStatus(DeliveryTour.TourStatus.valueOf(status.toUpperCase()));
            } catch (IllegalArgumentException e) {
                tours = deliveryTourService.listAllTours();
            }
        } else {
            tours = deliveryTourService.listAllTours();
        }
        return ResponseEntity.ok(tours.stream().map(this::mapToDto).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeliveryTourDTO> getTour(@PathVariable UUID id) {
        DeliveryTour tour = deliveryTourService.getTourDetail(id);
        return ResponseEntity.ok(mapToDto(tour));
    }

    @PutMapping("/{id}/validate")
    public ResponseEntity<DeliveryTourDTO> validateTour(@PathVariable UUID id) {
        DeliveryTour tour = deliveryTourService.validateTour(id);
        return ResponseEntity.ok(mapToDto(tour));
    }

    /** Démarre manuellement une tournée (VALIDE → EN_COURS) */
    @PutMapping("/{id}/start")
    public ResponseEntity<DeliveryTourDTO> startTour(@PathVariable UUID id) {
        return ResponseEntity.ok(mapToDto(deliveryTourService.startTour(id)));
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<DeliveryTourDTO> closeTour(@PathVariable UUID id) {
        deliveryTourService.closeTour(id);
        DeliveryTour tour = deliveryTourService.getTourDetail(id);
        return ResponseEntity.ok(mapToDto(tour));
    }

    private DeliveryTourDTO mapToDto(DeliveryTour tour) {
        return DeliveryTourDTO.builder()
                .id(tour.getId())
                .tourDate(tour.getTourDate())
                .representativeId(tour.getRepresentativeId())
                .vehicleId(tour.getVehicleId())
                .zone(tour.getZone())
                .status(tour.getStatus().toString())
                .build();
    }
}
