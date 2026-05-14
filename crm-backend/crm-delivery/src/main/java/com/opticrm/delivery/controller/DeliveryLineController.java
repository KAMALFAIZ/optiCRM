package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.DeliveryLineDTO;
import com.opticrm.delivery.entity.DeliveryLine;
import com.opticrm.delivery.service.DeliveryLineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/line")
@RequiredArgsConstructor
public class DeliveryLineController {

    private final DeliveryLineService deliveryLineService;

    @PostMapping
    public ResponseEntity<DeliveryLineDTO> addLine(@RequestBody DeliveryLineDTO dto) {
        DeliveryLine line = deliveryLineService.addDeliveryLine(
                dto.getDeliveryTourId(),
                dto.getCustomerId(),
                dto.getItemId(),
                dto.getQuantity(),
                dto.getQuantityDelivered(),
                dto.getUnitPrice(),
                dto.getDiscountPercent(),
                dto.getDiscountReason(),
                dto.getPaymentMode(),
                dto.getPaidAmount(),
                dto.getVisitResult(),
                dto.getVisitNotes(),
                dto.getChequeNumber(),
                dto.getTraiteDueDate(),
                dto.getBatchId(),
                dto.getLotNumber(),
                dto.getExpiryDate()
        );
        return ResponseEntity.ok(mapToDto(line));
    }

    @GetMapping("/tour/{tourId}/available-stock")
    public ResponseEntity<List<Map<String, Object>>> getAvailableStock(@PathVariable UUID tourId) {
        return ResponseEntity.ok(deliveryLineService.getAvailableStock(tourId));
    }

    @GetMapping("/customer/{customerId}/outstanding-credit")
    public ResponseEntity<Map<String, Object>> getOutstandingCredit(
            @PathVariable UUID customerId,
            @RequestParam(required = false) UUID excludeTourId) {
        java.math.BigDecimal credit = excludeTourId != null
            ? deliveryLineService.getOutstandingCreditExcludingTour(customerId, excludeTourId)
            : deliveryLineService.getOutstandingCredit(customerId);
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("customerId", customerId.toString());
        result.put("outstandingCredit", credit);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/tour/{tourId}")
    public ResponseEntity<List<DeliveryLineDTO>> listLinesByTour(@PathVariable UUID tourId) {
        List<DeliveryLine> lines = deliveryLineService.getDeliveryLinesByTour(tourId);
        return ResponseEntity.ok(lines.stream().map(this::mapToDto).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeliveryLineDTO> getLine(@PathVariable UUID id) {
        DeliveryLine line = deliveryLineService.getDeliveryLine(id);
        return ResponseEntity.ok(mapToDto(line));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeliveryLineDTO> updateLine(
            @PathVariable UUID id,
            @RequestBody DeliveryLineDTO dto) {
        DeliveryLine line = deliveryLineService.updateDeliveryLine(
                id,
                dto.getQuantity(),
                dto.getQuantityDelivered(),
                dto.getUnitPrice(),
                dto.getDiscountPercent(),
                dto.getDiscountReason(),
                dto.getPaymentMode(),
                dto.getPaidAmount(),
                dto.getVisitResult(),
                dto.getVisitNotes(),
                dto.getChequeNumber(),
                dto.getTraiteDueDate(),
                dto.getBatchId(),
                dto.getLotNumber(),
                dto.getExpiryDate()
        );
        return ResponseEntity.ok(mapToDto(line));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLine(@PathVariable UUID id) {
        deliveryLineService.deleteDeliveryLine(id);
        return ResponseEntity.noContent().build();
    }

    private DeliveryLineDTO mapToDto(DeliveryLine line) {
        return DeliveryLineDTO.builder()
                .id(line.getId())
                .deliveryTourId(line.getDeliveryTour() != null ? line.getDeliveryTour().getId() : null)
                .customerId(line.getCustomerId())
                .itemId(line.getItemId())
                .quantity(line.getQuantity())
                .quantityDelivered(line.getQuantityDelivered())
                .unitPrice(line.getUnitPrice())
                .discountPercent(line.getDiscountPercent())
                .discountReason(line.getDiscountReason())
                .amount(line.getAmount())
                .paymentMode(line.getPaymentMode() != null ? line.getPaymentMode().toString() : null)
                .paidAmount(line.getPaidAmount())
                .visitResult(line.getVisitResult() != null ? line.getVisitResult().toString() : null)
                .visitNotes(line.getVisitNotes())
                .chequeNumber(line.getChequeNumber())
                .traiteDueDate(line.getTraiteDueDate())
                .batchId(line.getBatchId())
                .lotNumber(line.getLotNumber())
                .expiryDate(line.getExpiryDate())
                .build();
    }
}
