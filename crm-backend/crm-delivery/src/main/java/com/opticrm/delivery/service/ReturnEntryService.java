package com.opticrm.delivery.service;

import com.opticrm.delivery.entity.DeliveryTour;
import com.opticrm.delivery.entity.ReturnEntry;
import com.opticrm.delivery.repository.DeliveryTourRepository;
import com.opticrm.delivery.repository.ReturnEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ReturnEntryService {

    private final ReturnEntryRepository returnEntryRepository;
    private final DeliveryTourRepository deliveryTourRepository;
    private final AuditTrailService auditTrailService;

    private void assertTourNotClosed(DeliveryTour tour) {
        if (tour.getStatus() == DeliveryTour.TourStatus.CLOSED) {
            throw new IllegalStateException("La tournée est clôturée. Aucune modification n'est autorisée.");
        }
    }

    /**
     * Crée un retour véhicule (invendu) ou un retour client (avoir).
     * Pour CUSTOMER_RETURN, deliveryLineId est obligatoire.
     */
    public ReturnEntry createReturnEntry(UUID tourId, UUID itemId, Integer quantity,
                                         String reason, UUID warehouseToId,
                                         String returnType, UUID deliveryLineId) {
        log.debug("Creating return entry for tour: {}", tourId);

        DeliveryTour tour = deliveryTourRepository.findById(tourId)
                .orElseThrow(() -> new IllegalArgumentException("Tour not found"));
        assertTourNotClosed(tour);

        ReturnEntry.ReturnType rt = returnType != null
            ? ReturnEntry.ReturnType.valueOf(returnType)
            : ReturnEntry.ReturnType.VEHICLE_RETURN;

        if (rt == ReturnEntry.ReturnType.CUSTOMER_RETURN && deliveryLineId == null) {
            throw new IllegalArgumentException(
                "deliveryLineId est obligatoire pour un retour client (CUSTOMER_RETURN).");
        }

        ReturnEntry entry = ReturnEntry.builder()
                .deliveryTour(tour)
                .itemId(itemId)
                .quantity(quantity)
                .reason(reason)
                .warehouseToId(warehouseToId)
                .returnType(rt)
                .deliveryLineId(deliveryLineId)
                .status(ReturnEntry.ReturnStatus.DRAFT)
                .build();

        ReturnEntry saved = returnEntryRepository.save(entry);
        auditTrailService.logAction("CREATE_RETURN_ENTRY", "ReturnEntry", saved.getId(), null,
            "Retour créé : type=" + rt + (deliveryLineId != null ? ", ligne=" + deliveryLineId : ""));
        return saved;
    }

    /** Compatibilité — retour véhicule sans deliveryLineId */
    public ReturnEntry createReturnEntry(UUID tourId, UUID itemId, Integer quantity,
                                         String reason, UUID warehouseToId) {
        return createReturnEntry(tourId, itemId, quantity, reason, warehouseToId, null, null);
    }

    public ReturnEntry receiveReturn(UUID entryId) {
        log.debug("Marking return as received: {}", entryId);

        ReturnEntry entry = returnEntryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Return entry not found"));
        assertTourNotClosed(entry.getDeliveryTour());

        entry.setStatus(ReturnEntry.ReturnStatus.RECEIVED);
        entry.setReceivedDate(LocalDateTime.now());

        ReturnEntry updated = returnEntryRepository.save(entry);
        auditTrailService.logAction("RECEIVE_RETURN", "ReturnEntry", updated.getId(), null, "Return marked as received");
        return updated;
    }

    public ReturnEntry validateReturn(UUID entryId) {
        log.debug("Validating return: {}", entryId);

        ReturnEntry entry = returnEntryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Return entry not found"));
        assertTourNotClosed(entry.getDeliveryTour());

        entry.setStatus(ReturnEntry.ReturnStatus.VALIDATED);

        ReturnEntry updated = returnEntryRepository.save(entry);
        auditTrailService.logAction("VALIDATE_RETURN", "ReturnEntry", updated.getId(), null, "Return validated");
        return updated;
    }

    public List<ReturnEntry> getReturnsByTour(UUID tourId) {
        return returnEntryRepository.findByDeliveryTourId(tourId);
    }

    public ReturnEntry getReturnEntry(UUID entryId) {
        return returnEntryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Return entry not found"));
    }
}
