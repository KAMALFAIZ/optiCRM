package com.opticrm.delivery.controller;

import com.opticrm.delivery.entity.RepLocation;
import com.opticrm.delivery.entity.OfflineSyncLog;
import com.opticrm.delivery.entity.DeliveryTour;
import com.opticrm.delivery.repository.RepLocationRepository;
import com.opticrm.delivery.repository.OfflineSyncLogRepository;
import com.opticrm.delivery.repository.DeliveryTourRepository;
import com.opticrm.delivery.service.DeliveryTourService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/delivery/gps")
@RequiredArgsConstructor
@Slf4j
public class GpsTrackingController {

    private final RepLocationRepository locationRepository;
    private final OfflineSyncLogRepository syncLogRepository;
    private final DeliveryTourRepository deliveryTourRepository;
    private final DeliveryTourService deliveryTourService;

    /** Enregistre une position GPS */
    @PostMapping("/track")
    public ResponseEntity<Map<String, Object>> track(@RequestBody Map<String, Object> body) {
        UUID repId   = body.get("representativeId") != null ? UUID.fromString((String) body.get("representativeId")) : null;
        UUID tourId  = body.get("deliveryTourId")   != null ? UUID.fromString((String) body.get("deliveryTourId"))   : null;
        UUID custId  = body.get("customerId")        != null ? UUID.fromString((String) body.get("customerId"))       : null;
        double lat   = ((Number) body.get("latitude")).doubleValue();
        double lng   = ((Number) body.get("longitude")).doubleValue();
        Double acc   = body.get("accuracy") != null ? ((Number) body.get("accuracy")).doubleValue() : null;
        String type  = body.getOrDefault("eventType", "TRACK").toString();

        RepLocation.EventType eventType = RepLocation.EventType.valueOf(type);

        RepLocation loc = RepLocation.builder()
            .representativeId(repId)
            .deliveryTourId(tourId)
            .latitude(lat)
            .longitude(lng)
            .accuracy(acc)
            .recordedAt(LocalDateTime.now())
            .eventType(eventType)
            .customerId(custId)
            .build();
        locationRepository.save(loc);

        // Déclencher automatiquement le passage EN_COURS lors du 1er TOUR_START
        if (eventType == RepLocation.EventType.TOUR_START && tourId != null) {
            deliveryTourRepository.findById(tourId).ifPresent(tour -> {
                if (tour.getStatus() == DeliveryTour.TourStatus.VALIDE) {
                    try {
                        deliveryTourService.startTour(tourId);
                        log.info("Tournée {} passée EN_COURS suite à TOUR_START GPS", tourId);
                    } catch (Exception e) {
                        log.warn("Impossible de démarrer la tournée {} via GPS : {}", tourId, e.getMessage());
                    }
                }
            });
        }

        return ResponseEntity.ok(Map.of("status", "ok", "id", loc.getId() != null ? loc.getId().toString() : ""));
    }

    /** Dernières positions connues de tous les reps */
    @GetMapping("/live")
    public ResponseEntity<List<Map<String, Object>>> getLive() {
        List<RepLocation> locs = locationRepository.findLastKnownPositions();
        return ResponseEntity.ok(locs.stream().map(this::toMap).toList());
    }

    /** Tracé GPS d'une tournée */
    @GetMapping("/tour/{tourId}")
    public ResponseEntity<List<Map<String, Object>>> getByTour(@PathVariable UUID tourId) {
        List<RepLocation> locs = locationRepository.findByDeliveryTourIdOrderByRecordedAtAsc(tourId);
        return ResponseEntity.ok(locs.stream().map(this::toMap).toList());
    }

    /** Endpoint de synchronisation hors-ligne — reçoit un batch d'actions */
    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncOffline(@RequestBody Map<String, Object> body) {
        String deviceId = body.getOrDefault("deviceId", "unknown").toString();
        UUID repId = body.get("representativeId") != null
            ? UUID.fromString((String) body.get("representativeId")) : null;

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> actions = (List<Map<String, Object>>) body.getOrDefault("actions", List.of());

        int synced = 0;
        for (Map<String, Object> action : actions) {
            try {
                // Log each action
                OfflineSyncLog log = OfflineSyncLog.builder()
                    .deviceId(deviceId)
                    .representativeId(repId)
                    .actionType(action.getOrDefault("type", "UNKNOWN").toString())
                    .payload(action.toString())
                    .syncStatus(OfflineSyncLog.SyncStatus.SYNCED)
                    .syncedAt(LocalDateTime.now())
                    .build();
                syncLogRepository.save(log);
                synced++;
            } catch (Exception e) {
                log.warn("Offline sync failed for action: {}", action, e);
            }
        }

        return ResponseEntity.ok(Map.of(
            "received", actions.size(),
            "synced", synced,
            "failed", actions.size() - synced
        ));
    }

    private Map<String, Object> toMap(RepLocation l) {
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("id",               l.getId() != null ? l.getId().toString() : null);
        m.put("representativeId", l.getRepresentativeId() != null ? l.getRepresentativeId().toString() : null);
        m.put("deliveryTourId",   l.getDeliveryTourId()   != null ? l.getDeliveryTourId().toString()   : null);
        m.put("customerId",       l.getCustomerId()        != null ? l.getCustomerId().toString()        : null);
        m.put("latitude",         l.getLatitude());
        m.put("longitude",        l.getLongitude());
        m.put("accuracy",         l.getAccuracy());
        m.put("eventType",        l.getEventType() != null ? l.getEventType().name() : null);
        m.put("recordedAt",       l.getRecordedAt() != null ? l.getRecordedAt().toString() : null);
        return m;
    }
}
