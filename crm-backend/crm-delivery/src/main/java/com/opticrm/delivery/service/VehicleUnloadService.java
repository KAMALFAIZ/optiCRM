package com.opticrm.delivery.service;

import com.opticrm.delivery.entity.*;
import com.opticrm.delivery.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class VehicleUnloadService {

    private final VehicleUnloadRepository vehicleUnloadRepository;
    private final VehicleLoadRepository vehicleLoadRepository;
    private final DeliveryLineRepository deliveryLineRepository;
    private final DeliveryTourRepository deliveryTourRepository;
    private final AuditTrailService auditTrailService;

    /**
     * Génère (ou regénère) le déchargement d'une tournée.
     * Pour chaque article chargé :
     *   - quantityLoaded  = SUM(vehicleLoad.quantity WHERE status=LOADED)
     *   - quantitySold    = SUM(deliveryLine.quantity WHERE visitResult=DELIVERED|PARTIAL)
     *   - quantityReturned = 0  (à renseigner manuellement)
     *   - quantityUnloaded = loaded - sold
     */
    public VehicleUnload generateForTour(UUID tourId) {
        log.info("Generating vehicle unload for tour: {}", tourId);

        DeliveryTour tour = deliveryTourRepository.findById(tourId)
            .orElseThrow(() -> new IllegalArgumentException("Tour not found: " + tourId));

        // Supprimer l'éventuel draft existant
        vehicleUnloadRepository.findByDeliveryTourId(tourId)
            .filter(u -> u.getStatus() == VehicleUnload.UnloadStatus.DRAFT)
            .ifPresent(vehicleUnloadRepository::delete);

        // Calcul par article — parcourt les sessions puis leurs lignes articles
        List<VehicleLoad> loads = vehicleLoadRepository.findByDeliveryTourId(tourId);
        Map<UUID, Integer> loadedByItem = new HashMap<>();
        for (VehicleLoad session : loads) {
            if (session.getStatus() == VehicleLoad.LoadStatus.LOADED) {
                for (com.opticrm.delivery.entity.VehicleLoadItem item : session.getItems()) {
                    loadedByItem.merge(item.getItemId(), item.getQuantity(), Integer::sum);
                }
            }
        }

        VehicleUnload unload = VehicleUnload.builder()
            .deliveryTourId(tourId)
            .unloadDate(LocalDateTime.now())
            .status(VehicleUnload.UnloadStatus.DRAFT)
            .items(new ArrayList<>())
            .build();
        VehicleUnload saved = vehicleUnloadRepository.save(unload);

        for (Map.Entry<UUID, Integer> entry : loadedByItem.entrySet()) {
            UUID itemId = entry.getKey();
            int loaded  = entry.getValue();
            int sold    = deliveryLineRepository.sumDeliveredOnlyQtyByTourAndItem(tourId, itemId);

            VehicleUnloadItem item = VehicleUnloadItem.builder()
                .unload(saved)
                .itemId(itemId)
                .quantityLoaded(loaded)
                .quantitySold(sold)
                .quantityReturned(0)
                .quantityUnloaded(Math.max(0, loaded - sold))
                .build();
            saved.getItems().add(item);
        }

        VehicleUnload result = vehicleUnloadRepository.save(saved);
        auditTrailService.logAction("GENERATE_UNLOAD", "VehicleUnload", result.getId(), null,
            "Déchargement généré pour tournée " + tourId);
        return result;
    }

    /**
     * Confirme le déchargement (validé par le magasinier).
     * Met à jour les quantités saisies manuellement et passe en CONFIRMED.
     */
    public VehicleUnload confirm(UUID unloadId, UUID confirmedBy,
                                  List<Map<String, Object>> itemUpdates) {
        VehicleUnload unload = vehicleUnloadRepository.findById(unloadId)
            .orElseThrow(() -> new IllegalArgumentException("Unload not found: " + unloadId));

        if (unload.getStatus() == VehicleUnload.UnloadStatus.CONFIRMED) {
            throw new IllegalStateException("Ce déchargement est déjà confirmé.");
        }

        // Mettre à jour les quantités retournées si fournies
        if (itemUpdates != null) {
            for (Map<String, Object> update : itemUpdates) {
                UUID itemId = UUID.fromString((String) update.get("itemId"));
                Integer qtyReturned = update.get("quantityReturned") != null
                    ? ((Number) update.get("quantityReturned")).intValue() : null;
                Integer qtyUnloaded = update.get("quantityUnloaded") != null
                    ? ((Number) update.get("quantityUnloaded")).intValue() : null;

                unload.getItems().stream()
                    .filter(i -> i.getItemId().equals(itemId))
                    .findFirst()
                    .ifPresent(i -> {
                        if (qtyReturned != null) i.setQuantityReturned(qtyReturned);
                        if (qtyUnloaded != null) i.setQuantityUnloaded(qtyUnloaded);
                    });
            }
        }

        unload.setStatus(VehicleUnload.UnloadStatus.CONFIRMED);
        unload.setConfirmedBy(confirmedBy);
        unload.setConfirmedAt(LocalDateTime.now());

        VehicleUnload confirmed = vehicleUnloadRepository.save(unload);
        auditTrailService.logAction("CONFIRM_UNLOAD", "VehicleUnload", confirmed.getId(), null,
            "Déchargement confirmé par " + confirmedBy);
        return confirmed;
    }

    @Transactional(readOnly = true)
    public VehicleUnload getByTour(UUID tourId) {
        return vehicleUnloadRepository.findByDeliveryTourId(tourId)
            .orElseThrow(() -> new IllegalArgumentException("Aucun déchargement pour cette tournée"));
    }

    @Transactional(readOnly = true)
    public Optional<VehicleUnload> findByTour(UUID tourId) {
        return vehicleUnloadRepository.findByDeliveryTourId(tourId);
    }
}
