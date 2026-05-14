package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.SyncBundleDTO;
import com.opticrm.delivery.dto.SyncPushDTO;
import com.opticrm.delivery.service.SyncBundleService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncBundleService syncBundleService;

    /**
     * GET /sync/bundle?repId=&date= — téléchargement du bundle hors-ligne.
     * L'appareil mobile appelle cet endpoint avant de partir en tournée.
     */
    @GetMapping("/bundle")
    public ResponseEntity<SyncBundleDTO> getBundle(
            @RequestParam UUID repId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(syncBundleService.buildBundle(repId, date));
    }

    /**
     * POST /sync/push — synchronisation hors-ligne.
     * Retourne un rapport détaillé par ligne (OK / CONFLICT / REJECTED).
     */
    @PostMapping("/push")
    public ResponseEntity<SyncBundleService.SyncPushResult> push(@RequestBody SyncPushDTO dto) {
        return ResponseEntity.ok(syncBundleService.processPush(dto));
    }
}
