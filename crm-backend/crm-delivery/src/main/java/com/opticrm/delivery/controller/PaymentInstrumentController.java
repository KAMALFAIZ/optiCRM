package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.PaymentInstrumentDTO;
import com.opticrm.delivery.entity.PaymentInstrument;
import com.opticrm.delivery.service.PaymentInstrumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/delivery/payment-instruments")
@RequiredArgsConstructor
public class PaymentInstrumentController {

    private final PaymentInstrumentService instrumentService;

    @PostMapping
    public ResponseEntity<PaymentInstrumentDTO> register(
            @RequestParam UUID deliveryLineId,
            @RequestParam String instrumentType,
            @RequestParam String instrumentNumber,
            @RequestParam(required = false) String bankName,
            @RequestParam BigDecimal amount,
            @RequestParam(required = false) LocalDate dueDate,
            @RequestParam(required = false) String notes) {
        PaymentInstrument saved = instrumentService.register(
            deliveryLineId, instrumentType, instrumentNumber, bankName, amount, dueDate, notes);
        return ResponseEntity.ok(instrumentService.toDTO(saved));
    }

    @PutMapping("/{id}/encaisse")
    public ResponseEntity<PaymentInstrumentDTO> markEncaisse(
            @PathVariable UUID id,
            @RequestParam(required = false) LocalDate encashDate) {
        return ResponseEntity.ok(instrumentService.toDTO(instrumentService.markEncaisse(id, encashDate)));
    }

    @PutMapping("/{id}/rejete")
    public ResponseEntity<PaymentInstrumentDTO> markRejete(
            @PathVariable UUID id,
            @RequestParam(required = false) String rejectionReason) {
        return ResponseEntity.ok(instrumentService.toDTO(instrumentService.markRejete(id, rejectionReason)));
    }

    @GetMapping("/by-line/{deliveryLineId}")
    public ResponseEntity<List<PaymentInstrumentDTO>> getByLine(@PathVariable UUID deliveryLineId) {
        return ResponseEntity.ok(
            instrumentService.getByLine(deliveryLineId).stream()
                .map(instrumentService::toDTO).toList());
    }

    @GetMapping("/by-tour/{tourId}")
    public ResponseEntity<List<PaymentInstrumentDTO>> getByTour(@PathVariable UUID tourId) {
        return ResponseEntity.ok(
            instrumentService.getByTour(tourId).stream()
                .map(instrumentService::toDTO).toList());
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<PaymentInstrumentDTO>> getOverdue() {
        return ResponseEntity.ok(
            instrumentService.getPendingOverdue().stream()
                .map(instrumentService::toDTO).toList());
    }
}
