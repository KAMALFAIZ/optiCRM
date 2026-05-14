package com.opticrm.delivery.service;

import com.opticrm.delivery.dto.SyncBundleDTO;
import com.opticrm.delivery.dto.SyncPushDTO;
import com.opticrm.delivery.entity.*;
import com.opticrm.delivery.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class SyncBundleService {

    private final DeliveryTourRepository tourRepository;
    private final VehicleLoadRepository vehicleLoadRepository;
    private final PreOrderRepository preOrderRepository;
    private final DeliveryPromotionRepository promotionRepository;
    private final RepLocationRepository locationRepository;
    private final OfflineSyncLogRepository syncLogRepository;
    private final DeliveryLineService deliveryLineService;

    /**
     * Construit le bundle hors-ligne pour un représentant à une date donnée.
     * Contient: tournée du jour, chargement véhicule, pré-commandes, promotions actives.
     */
    @Transactional(readOnly = true)
    public SyncBundleDTO buildBundle(UUID repId, LocalDate date) {
        final LocalDate targetDate = date != null ? date : LocalDate.now();

        List<DeliveryTour> tours = tourRepository.findByRepresentativeId(repId);
        Optional<DeliveryTour> todayTour = tours.stream()
            .filter(t -> targetDate.equals(t.getTourDate()))
            .filter(t -> t.getStatus() != DeliveryTour.TourStatus.CLOSED)
            .findFirst();

        SyncBundleDTO.TourInfo tourInfo = null;
        List<SyncBundleDTO.LoadItem> loads = List.of();
        List<com.opticrm.delivery.dto.PreOrderDTO> preOrders = List.of();

        if (todayTour.isPresent()) {
            DeliveryTour tour = todayTour.get();
            tourInfo = SyncBundleDTO.TourInfo.builder()
                .tourId(tour.getId())
                .tourDate(tour.getTourDate())
                .zone(tour.getZone())
                .status(tour.getStatus().name())
                .build();

            List<VehicleLoad> vl = vehicleLoadRepository.findByDeliveryTourId(tour.getId());
            loads = vl.stream()
                .flatMap(l -> l.getItems().stream()
                    .map(item -> SyncBundleDTO.LoadItem.builder()
                        .itemId(item.getItemId())
                        .quantity(item.getQuantity())
                        .lotNumber(item.getLotNumber())
                        .expiryDate(item.getExpiryDate())
                        .build()))
                .toList();

            preOrders = preOrderRepository.findByDeliveryTourId(tour.getId()).stream()
                .map(this::toPreOrderDTO)
                .toList();
        }

        List<SyncBundleDTO.ActivePromotion> promotions = promotionRepository.findByIsActiveTrue()
            .stream()
            .filter(p -> isValidToday(p, targetDate))
            .map(p -> SyncBundleDTO.ActivePromotion.builder()
                .promotionId(p.getId())
                .name(p.getName())
                .itemId(p.getItemId())
                .minQuantity(p.getMinQuantity())
                .bonusItemId(p.getBonusItemId())
                .bonusQuantity(p.getBonusQuantity())
                .zone(p.getZone())
                .validTo(p.getValidTo())
                .build())
            .toList();

        return SyncBundleDTO.builder()
            .repId(repId)
            .date(targetDate)
            .generatedAt(Instant.now())
            .tour(tourInfo)
            .vehicleLoads(loads)
            .preOrders(preOrders)
            .promotions(promotions)
            .build();
    }

    /**
     * Traite un push hors-ligne depuis l'appareil mobile.
     * Retourne un rapport détaillé par ligne (OK / CONFLICT / REJECTED) pour que
     * le mobile puisse afficher les éléments nécessitant une résolution manuelle.
     */
    public SyncPushResult processPush(SyncPushDTO push) {
        List<LineResult> lineResults = new ArrayList<>();
        int gpsOk = 0;

        if (push.getDeliveryLines() != null) {
            for (SyncPushDTO.OfflineDeliveryLine dl : push.getDeliveryLines()) {
                try {
                    deliveryLineService.addDeliveryLine(
                        dl.getTourId(),
                        dl.getCustomerId(),
                        dl.getItemId(),
                        dl.getQuantity(),
                        null,               // quantityDelivered — déterminé par visitResult
                        dl.getUnitPrice(),
                        null, null,         // discount — non géré offline
                        dl.getPaymentMode(),
                        dl.getPaidAmount(),
                        dl.getVisitResult(),
                        dl.getVisitNotes(),
                        dl.getChequeNumber(),
                        dl.getTraiteDueDate(),
                        dl.getBatchId(),
                        dl.getLotNumber(),
                        dl.getExpiryDate()
                    );
                    lineResults.add(new LineResult(
                        dl.getTourId(), dl.getCustomerId(), dl.getItemId(),
                        "OK", null));
                } catch (IllegalStateException e) {
                    // Conflit métier (stock insuffisant, tournée clôturée, crédit bloqué…)
                    String reason = e.getMessage();
                    log.warn("CONFLICT offline line tour={} customer={}: {}", dl.getTourId(), dl.getCustomerId(), reason);
                    logSyncFailure(push.getDeviceId(), push.getRepresentativeId(),
                        "CREATE_DELIVERY_LINE", dl.toString(), reason);
                    lineResults.add(new LineResult(
                        dl.getTourId(), dl.getCustomerId(), dl.getItemId(),
                        "CONFLICT", reason));
                } catch (Exception e) {
                    // Erreur technique (données manquantes, enum invalide…)
                    String reason = e.getMessage();
                    log.warn("REJECTED offline line tour={} customer={}: {}", dl.getTourId(), dl.getCustomerId(), reason);
                    logSyncFailure(push.getDeviceId(), push.getRepresentativeId(),
                        "CREATE_DELIVERY_LINE", dl.toString(), reason);
                    lineResults.add(new LineResult(
                        dl.getTourId(), dl.getCustomerId(), dl.getItemId(),
                        "REJECTED", reason));
                }
            }
        }

        if (push.getGpsPoints() != null) {
            for (SyncPushDTO.OfflineGpsPoint pt : push.getGpsPoints()) {
                try {
                    RepLocation loc = RepLocation.builder()
                        .representativeId(push.getRepresentativeId())
                        .deliveryTourId(pt.getTourId())
                        .latitude(pt.getLatitude())
                        .longitude(pt.getLongitude())
                        .accuracy(pt.getAccuracy())
                        .recordedAt(pt.getRecordedAt() != null
                            ? LocalDateTime.parse(pt.getRecordedAt())
                            : LocalDateTime.now())
                        .eventType(pt.getEventType() != null
                            ? RepLocation.EventType.valueOf(pt.getEventType())
                            : RepLocation.EventType.TRACK)
                        .customerId(pt.getCustomerId())
                        .build();
                    locationRepository.save(loc);
                    gpsOk++;
                } catch (Exception e) {
                    log.warn("Offline GPS point failed: {}", e.getMessage());
                }
            }
        }

        long linesOk       = lineResults.stream().filter(r -> "OK".equals(r.status())).count();
        long linesConflict = lineResults.stream().filter(r -> "CONFLICT".equals(r.status())).count();
        long linesRejected = lineResults.stream().filter(r -> "REJECTED".equals(r.status())).count();
        boolean hasErrors  = linesConflict + linesRejected > 0;

        OfflineSyncLog syncLog = OfflineSyncLog.builder()
            .deviceId(push.getDeviceId())
            .representativeId(push.getRepresentativeId())
            .actionType("OFFLINE_PUSH")
            .payload("lines=" + lineResults.size() + " gps=" + (push.getGpsPoints() != null ? push.getGpsPoints().size() : 0))
            .syncStatus(hasErrors ? OfflineSyncLog.SyncStatus.PARTIAL : OfflineSyncLog.SyncStatus.SYNCED)
            .syncedAt(LocalDateTime.now())
            .build();
        syncLogRepository.save(syncLog);

        return new SyncPushResult(lineResults, (int) linesOk, (int) linesConflict, (int) linesRejected, gpsOk);
    }

    public record LineResult(
        UUID tourId,
        UUID customerId,
        UUID itemId,
        String status,    // OK | CONFLICT | REJECTED
        String reason
    ) {}

    public record SyncPushResult(
        List<LineResult> lines,
        int linesOk,
        int linesConflict,
        int linesRejected,
        int gpsOk
    ) {
        public boolean hasConflicts() { return linesConflict > 0; }
        public boolean hasRejected()  { return linesRejected > 0; }
    }

    private boolean isValidToday(DeliveryPromotion p, LocalDate today) {
        if (p.getValidFrom() != null && today.isBefore(p.getValidFrom())) return false;
        if (p.getValidTo()   != null && today.isAfter(p.getValidTo()))   return false;
        return true;
    }

    private void logSyncFailure(String deviceId, UUID repId, String actionType, String payload, String error) {
        try {
            syncLogRepository.save(OfflineSyncLog.builder()
                .deviceId(deviceId)
                .representativeId(repId)
                .actionType(actionType)
                .payload(payload != null && payload.length() > 2000 ? payload.substring(0, 2000) : payload)
                .syncStatus(OfflineSyncLog.SyncStatus.FAILED)
                .syncedAt(LocalDateTime.now())
                .errorMessage(error != null && error.length() > 500 ? error.substring(0, 500) : error)
                .build());
        } catch (Exception ignored) {}
    }

    private com.opticrm.delivery.dto.PreOrderDTO toPreOrderDTO(PreOrder o) {
        List<com.opticrm.delivery.dto.PreOrderDTO.PreOrderItemDTO> items = new ArrayList<>();
        if (o.getItems() != null) {
            for (PreOrderItem i : o.getItems()) {
                items.add(com.opticrm.delivery.dto.PreOrderDTO.PreOrderItemDTO.builder()
                    .id(i.getId())
                    .itemId(i.getItemId())
                    .quantityOrdered(i.getQuantityOrdered())
                    .quantityConfirmed(i.getQuantityConfirmed())
                    .unitPrice(i.getUnitPrice())
                    .build());
            }
        }
        return com.opticrm.delivery.dto.PreOrderDTO.builder()
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
