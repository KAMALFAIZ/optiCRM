package com.opticrm.delivery.controller;

import com.opticrm.delivery.entity.AuditTrail;
import com.opticrm.delivery.service.AuditTrailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/audit-trail")
@RequiredArgsConstructor
public class AuditTrailController {

    private final AuditTrailService auditTrailService;

    @GetMapping("/entity")
    public ResponseEntity<List<AuditTrail>> getHistory(
            @RequestParam String entityType,
            @RequestParam UUID entityId) {
        List<AuditTrail> history = auditTrailService.getHistory(entityType, entityId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<AuditTrail>> getHistoryByDateRange(
            @RequestParam LocalDate from,
            @RequestParam LocalDate to) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
        List<AuditTrail> history = auditTrailService.getHistoryByDateRange(fromDateTime, toDateTime);
        return ResponseEntity.ok(history);
    }
}
