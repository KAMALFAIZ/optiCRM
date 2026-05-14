package com.opticrm.delivery.service;

import com.opticrm.delivery.entity.DeliveryTour;
import com.opticrm.delivery.repository.DeliveryTourRepository;
import com.opticrm.delivery.repository.SettlementReportRepository;
import com.opticrm.delivery.repository.VehicleUnloadRepository;
import com.opticrm.delivery.repository.PreOrderRepository;
import com.opticrm.delivery.entity.SettlementReport;
import com.opticrm.delivery.entity.VehicleUnload;
import com.opticrm.delivery.entity.PreOrder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class DeliveryTourService {

    private final DeliveryTourRepository deliveryTourRepository;
    private final SettlementReportRepository settlementReportRepository;
    private final VehicleUnloadRepository vehicleUnloadRepository;
    private final PreOrderRepository preOrderRepository;
    private final AuditTrailService auditTrailService;

    public DeliveryTour createTour(LocalDate tourDate, UUID representativeId, UUID vehicleId, String zone) {
        log.info("Creating delivery tour for date: {}, representative: {}", tourDate, representativeId);

        // Règle : un représentant ne peut avoir qu'une seule tournée non-clôturée par jour
        if (representativeId != null) {
            boolean conflict = deliveryTourRepository
                .existsByRepresentativeIdAndTourDateAndStatusNot(
                    representativeId, tourDate, DeliveryTour.TourStatus.CLOSED);
            if (conflict) {
                throw new IllegalStateException(
                    "Ce représentant a déjà une tournée planifiée ou active pour cette date. " +
                    "Clôturez ou supprimez la tournée existante avant d'en créer une nouvelle.");
            }
        }

        DeliveryTour tour = DeliveryTour.builder()
                .tourDate(tourDate)
                .representativeId(representativeId)
                .vehicleId(vehicleId)
                .zone(zone)
                .status(DeliveryTour.TourStatus.DRAFT)
                .build();

        DeliveryTour saved = deliveryTourRepository.save(tour);
        auditTrailService.logAction("Create", "DeliveryTour", saved.getId(), null, "Tour créée");
        return saved;
    }

    public DeliveryTour validateTour(UUID tourId) {
        log.info("Validating tour: {}", tourId);

        DeliveryTour tour = deliveryTourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));

        if (tour.getStatus() != DeliveryTour.TourStatus.DRAFT) {
            throw new IllegalStateException(
                "Seule une tournée en statut BROUILLON peut être validée.");
        }

        // Règle : un représentant ne peut avoir qu'une seule tournée active (VALIDE ou EN_COURS) à la fois
        if (tour.getRepresentativeId() != null &&
            deliveryTourRepository.existsByRepresentativeIdAndStatusIn(
                tour.getRepresentativeId(),
                Set.of(DeliveryTour.TourStatus.VALIDE, DeliveryTour.TourStatus.EN_COURS))) {
            throw new IllegalStateException(
                "Ce représentant a déjà une tournée active (validée ou en cours). " +
                "Impossible d'en valider une deuxième simultanément.");
        }

        tour.setStatus(DeliveryTour.TourStatus.VALIDE);
        DeliveryTour saved = deliveryTourRepository.save(tour);
        auditTrailService.logAction("Validate", "DeliveryTour", tourId, null, "Tour validée");
        return saved;
    }

    /**
     * Démarre une tournée validée (1ère présence terrain).
     * Déclenché automatiquement par un point GPS TOUR_START ou manuellement.
     */
    public DeliveryTour startTour(UUID tourId) {
        log.info("Starting tour: {}", tourId);
        DeliveryTour tour = deliveryTourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));

        if (tour.getStatus() != DeliveryTour.TourStatus.VALIDE) {
            throw new IllegalStateException(
                "Seule une tournée VALIDÉE peut être démarrée. Statut actuel : " + tour.getStatus());
        }

        tour.setStatus(DeliveryTour.TourStatus.EN_COURS);
        DeliveryTour saved = deliveryTourRepository.save(tour);
        auditTrailService.logAction("Start", "DeliveryTour", tourId, null, "Tournée démarrée sur le terrain");
        return saved;
    }

    /**
     * Clôture une tournée. Préconditions métier obligatoires :
     * 1. Tournée doit être EN_COURS (ou VALIDE si démarrage manuel non fait)
     * 2. Un déchargement véhicule CONFIRMED doit exister
     * 3. Le rapport de règlement doit être FINALIZED
     * 4. Toutes les pré-commandes CONFIRMED de la tournée doivent être DELIVERED ou CANCELLED
     */
    public void closeTour(UUID tourId) {
        log.info("Closing tour: {}", tourId);

        DeliveryTour tour = deliveryTourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));

        if (tour.getStatus() != DeliveryTour.TourStatus.EN_COURS
                && tour.getStatus() != DeliveryTour.TourStatus.VALIDE) {
            throw new IllegalStateException(
                "Seule une tournée EN COURS ou VALIDÉE peut être clôturée. Statut actuel : " + tour.getStatus());
        }

        // Précondition 1 : déchargement véhicule confirmé
        boolean unloadConfirmed = vehicleUnloadRepository.findByDeliveryTourId(tourId)
            .map(u -> u.getStatus() == VehicleUnload.UnloadStatus.CONFIRMED)
            .orElse(false);
        if (!unloadConfirmed) {
            throw new IllegalStateException(
                "Impossible de clôturer : le déchargement véhicule n'est pas encore confirmé.");
        }

        // Précondition 2 : rapport de règlement finalisé (ou approuvé si écart)
        settlementReportRepository.findByDeliveryTourId(tourId).ifPresent(report -> {
            if (report.getStatus() != SettlementReport.SettlementStatus.FINALIZED) {
                throw new IllegalStateException(
                    "Impossible de clôturer : le rapport de règlement n'est pas encore finalisé " +
                    "(statut actuel : " + report.getStatus() + ").");
            }
        });

        // Précondition 3 : toutes les pré-commandes CONFIRMED sont DELIVERED ou CANCELLED
        long pendingOrders = preOrderRepository.findByDeliveryTourId(tourId).stream()
            .filter(o -> o.getStatus() == PreOrder.PreOrderStatus.CONFIRMED)
            .count();
        if (pendingOrders > 0) {
            throw new IllegalStateException(
                "Impossible de clôturer : " + pendingOrders +
                " pré-commande(s) confirmée(s) n'ont pas encore été livrée(s) ou annulée(s).");
        }

        tour.setStatus(DeliveryTour.TourStatus.CLOSED);
        deliveryTourRepository.save(tour);
        auditTrailService.logAction("Close", "DeliveryTour", tourId, null, "Tour clôturée");
    }

    public DeliveryTour.TourStatus getTourStatus(UUID tourId) {
        return deliveryTourRepository.findById(tourId)
                .map(DeliveryTour::getStatus)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
    }

    public List<DeliveryTour> listAllTours() {
        return deliveryTourRepository.findAll();
    }

    public List<DeliveryTour> listToursByDate(LocalDate tourDate) {
        return deliveryTourRepository.findByTourDate(tourDate);
    }

    public List<DeliveryTour> listToursByStatus(DeliveryTour.TourStatus status) {
        return deliveryTourRepository.findByStatus(status);
    }

    public DeliveryTour getTourDetail(UUID tourId) {
        return deliveryTourRepository.findById(tourId)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
    }
}
