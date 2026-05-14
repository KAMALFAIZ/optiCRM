package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.ReturnEntryDTO;
import com.opticrm.delivery.entity.ReturnEntry;
import com.opticrm.delivery.service.ReturnEntryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/return-entry")
@RequiredArgsConstructor
public class ReturnEntryController {

    private final ReturnEntryService returnEntryService;

    @PostMapping
    public ResponseEntity<ReturnEntryDTO> createReturn(@RequestBody ReturnEntryDTO dto) {
        ReturnEntry entry = returnEntryService.createReturnEntry(
                dto.getDeliveryTourId(),
                dto.getItemId(),
                dto.getQuantity(),
                dto.getReason(),
                dto.getWarehouseToId(),
                dto.getReturnType(),
                dto.getDeliveryLineId()
        );
        return ResponseEntity.ok(mapToDto(entry));
    }

    @GetMapping("/tour/{tourId}")
    public ResponseEntity<List<ReturnEntryDTO>> listReturnsByTour(@PathVariable UUID tourId) {
        List<ReturnEntry> entries = returnEntryService.getReturnsByTour(tourId);
        return ResponseEntity.ok(entries.stream().map(this::mapToDto).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReturnEntryDTO> getReturn(@PathVariable UUID id) {
        ReturnEntry entry = returnEntryService.getReturnEntry(id);
        return ResponseEntity.ok(mapToDto(entry));
    }

    @PutMapping("/{id}/receive")
    public ResponseEntity<ReturnEntryDTO> receiveReturn(@PathVariable UUID id) {
        ReturnEntry entry = returnEntryService.receiveReturn(id);
        return ResponseEntity.ok(mapToDto(entry));
    }

    @PutMapping("/{id}/validate")
    public ResponseEntity<ReturnEntryDTO> validateReturn(@PathVariable UUID id) {
        ReturnEntry entry = returnEntryService.validateReturn(id);
        return ResponseEntity.ok(mapToDto(entry));
    }

    private ReturnEntryDTO mapToDto(ReturnEntry entry) {
        return ReturnEntryDTO.builder()
                .id(entry.getId())
                .deliveryTourId(entry.getDeliveryTour() != null ? entry.getDeliveryTour().getId() : null)
                .itemId(entry.getItemId())
                .quantity(entry.getQuantity())
                .reason(entry.getReason())
                .receivedDate(entry.getReceivedDate())
                .warehouseToId(entry.getWarehouseToId())
                .returnType(entry.getReturnType() != null ? entry.getReturnType().name() : null)
                .deliveryLineId(entry.getDeliveryLineId())
                .status(entry.getStatus() != null ? entry.getStatus().toString() : null)
                .build();
    }
}
