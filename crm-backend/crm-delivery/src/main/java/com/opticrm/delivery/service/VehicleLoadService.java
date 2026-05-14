package com.opticrm.delivery.service;

import com.opticrm.delivery.dto.VehicleLoadKpiDTO;
import com.opticrm.delivery.dto.VehicleLoadDTO;
import com.opticrm.delivery.dto.VehicleLoadGroupDTO;
import com.opticrm.delivery.entity.DeliveryTour;
import com.opticrm.delivery.entity.VehicleLoad;
import com.opticrm.delivery.entity.VehicleLoadItem;
import com.opticrm.delivery.repository.DeliveryTourRepository;
import com.opticrm.delivery.repository.VehicleLoadItemRepository;
import com.opticrm.delivery.repository.VehicleLoadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class VehicleLoadService {

    private final VehicleLoadRepository vehicleLoadRepository;
    private final VehicleLoadItemRepository vehicleLoadItemRepository;
    private final DeliveryTourRepository deliveryTourRepository;
    private final AuditTrailService auditTrailService;

    // ─── Guards ──────────────────────────────────────────────────────────────

    private void assertTourNotClosed(DeliveryTour tour) {
        if (tour.getStatus() == DeliveryTour.TourStatus.CLOSED) {
            throw new IllegalStateException("La tournée est clôturée. Aucune modification n'est autorisée.");
        }
    }

    private void assertSessionNotLoaded(VehicleLoad session) {
        if (session.getStatus() == VehicleLoad.LoadStatus.LOADED) {
            throw new IllegalStateException("Impossible de modifier une session de chargement déjà confirmée.");
        }
    }

    private void assertQuantityPositive(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("La quantité doit être positive.");
        }
    }

    // ─── Session : création ───────────────────────────────────────────────────

    /**
     * Crée une nouvelle session de chargement (entête) avec ses lignes articles.
     * Une session regroupe tous les articles chargés au même moment depuis le même dépôt.
     */
    public VehicleLoad createSession(UUID tourId, UUID warehouseFromId,
                                     List<VehicleLoadItemRequest> itemRequests) {
        log.debug("Creating vehicle load session for tour: {}", tourId);

        if (itemRequests == null || itemRequests.isEmpty()) {
            throw new IllegalArgumentException("Une session de chargement doit contenir au moins un article.");
        }

        DeliveryTour tour = deliveryTourRepository.findById(tourId)
                .orElseThrow(() -> new IllegalArgumentException("Tournée introuvable : " + tourId));
        assertTourNotClosed(tour);

        VehicleLoad session = VehicleLoad.builder()
                .deliveryTour(tour)
                .loadDate(LocalDateTime.now())
                .warehouseFromId(warehouseFromId)
                .status(VehicleLoad.LoadStatus.DRAFT)
                .build();

        VehicleLoad saved = vehicleLoadRepository.save(session);

        for (VehicleLoadItemRequest req : itemRequests) {
            assertQuantityPositive(req.quantity());
            VehicleLoadItem item = VehicleLoadItem.builder()
                    .vehicleLoad(saved)
                    .itemId(req.itemId())
                    .quantity(req.quantity())
                    .batchId(req.batchId())
                    .lotNumber(req.lotNumber())
                    .expiryDate(req.expiryDate())
                    .build();
            saved.getItems().add(item);
        }

        VehicleLoad result = vehicleLoadRepository.save(saved);
        auditTrailService.logAction("CREATE_LOAD_SESSION", "VehicleLoad", result.getId(), null,
                "Session créée : " + result.getItems().size() + " article(s), dépôt=" + warehouseFromId);
        return result;
    }

    // ─── Session : confirmation ───────────────────────────────────────────────

    public VehicleLoad confirmSession(UUID sessionId) {
        log.debug("Confirming load session: {}", sessionId);

        VehicleLoad session = vehicleLoadRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session introuvable : " + sessionId));
        assertTourNotClosed(session.getDeliveryTour());
        assertSessionNotLoaded(session);

        if (session.getItems().isEmpty()) {
            throw new IllegalStateException("Impossible de confirmer une session sans articles.");
        }

        session.setStatus(VehicleLoad.LoadStatus.LOADED);
        VehicleLoad confirmed = vehicleLoadRepository.save(session);
        auditTrailService.logAction("CONFIRM_LOAD_SESSION", "VehicleLoad", confirmed.getId(), null,
                "Session confirmée (LOADED) : " + confirmed.getItems().size() + " article(s)");
        return confirmed;
    }

    public int confirmAllForTour(UUID tourId) {
        log.debug("Confirming all DRAFT sessions for tour: {}", tourId);

        DeliveryTour tour = deliveryTourRepository.findById(tourId)
                .orElseThrow(() -> new IllegalArgumentException("Tournée introuvable : " + tourId));
        assertTourNotClosed(tour);

        List<VehicleLoad> drafts = vehicleLoadRepository.findByDeliveryTourId(tourId).stream()
                .filter(s -> s.getStatus() == VehicleLoad.LoadStatus.DRAFT)
                .toList();

        for (VehicleLoad s : drafts) {
            s.setStatus(VehicleLoad.LoadStatus.LOADED);
        }
        vehicleLoadRepository.saveAll(drafts);

        auditTrailService.logAction("CONFIRM_ALL_LOAD_SESSIONS", "VehicleLoad", tourId, null,
                drafts.size() + " session(s) confirmée(s) pour la tournée");
        return drafts.size();
    }

    // ─── Lignes articles : ajout / modification / suppression ────────────────

    public VehicleLoadItem addItem(UUID sessionId, UUID itemId, Integer quantity,
                                   UUID batchId, String lotNumber, LocalDate expiryDate) {
        assertQuantityPositive(quantity);

        VehicleLoad session = vehicleLoadRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session introuvable : " + sessionId));
        assertTourNotClosed(session.getDeliveryTour());
        assertSessionNotLoaded(session);

        VehicleLoadItem item = VehicleLoadItem.builder()
                .vehicleLoad(session)
                .itemId(itemId)
                .quantity(quantity)
                .batchId(batchId)
                .lotNumber(lotNumber)
                .expiryDate(expiryDate)
                .build();

        VehicleLoadItem saved = vehicleLoadItemRepository.save(item);
        auditTrailService.logAction("ADD_LOAD_ITEM", "VehicleLoadItem", saved.getId(), null,
                "Article ajouté : article=" + itemId + ", qté=" + quantity);
        return saved;
    }

    public VehicleLoadItem updateItem(UUID itemId, Integer quantity,
                                      UUID batchId, String lotNumber, LocalDate expiryDate) {
        VehicleLoadItem item = vehicleLoadItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Article introuvable : " + itemId));
        assertTourNotClosed(item.getVehicleLoad().getDeliveryTour());
        assertSessionNotLoaded(item.getVehicleLoad());

        if (quantity != null) {
            assertQuantityPositive(quantity);
            item.setQuantity(quantity);
        }
        if (batchId != null) item.setBatchId(batchId);
        if (lotNumber != null) item.setLotNumber(lotNumber);
        if (expiryDate != null) item.setExpiryDate(expiryDate);

        VehicleLoadItem updated = vehicleLoadItemRepository.save(item);
        auditTrailService.logAction("UPDATE_LOAD_ITEM", "VehicleLoadItem", updated.getId(), null,
                "Article mis à jour : qté=" + quantity);
        return updated;
    }

    public void deleteItem(UUID itemId) {
        VehicleLoadItem item = vehicleLoadItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Article introuvable : " + itemId));
        assertTourNotClosed(item.getVehicleLoad().getDeliveryTour());
        assertSessionNotLoaded(item.getVehicleLoad());

        vehicleLoadItemRepository.delete(item);
        auditTrailService.logAction("DELETE_LOAD_ITEM", "VehicleLoadItem", itemId, null,
                "Article supprimé de la session");
    }

    public void deleteSession(UUID sessionId) {
        VehicleLoad session = vehicleLoadRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session introuvable : " + sessionId));
        assertTourNotClosed(session.getDeliveryTour());
        assertSessionNotLoaded(session);

        vehicleLoadRepository.delete(session);
        auditTrailService.logAction("DELETE_LOAD_SESSION", "VehicleLoad", sessionId, null,
                "Session de chargement supprimée");
    }

    // ─── Lectures ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VehicleLoad> getLoadsByTour(UUID tourId) {
        return vehicleLoadRepository.findByDeliveryTourId(tourId);
    }

    @Transactional(readOnly = true)
    public VehicleLoad getSession(UUID sessionId) {
        return vehicleLoadRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session introuvable : " + sessionId));
    }

    @Transactional(readOnly = true)
    public List<VehicleLoad> getLoadsByDateAndZone(LocalDate date, String zone) {
        if (date == null) date = LocalDate.now();
        String zoneParam = (zone == null || zone.isBlank()) ? null : zone;
        return vehicleLoadRepository.findByTourDateAndZone(date, zoneParam);
    }

    // ─── KPI cards ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public VehicleLoadKpiDTO getKpi(LocalDate date, String zone) {
        if (date == null) date = LocalDate.now();
        String zoneParam = (zone == null || zone.isBlank()) ? null : zone;

        long total      = vehicleLoadRepository.countByDateAndZone(date, zoneParam);
        long totalQte   = vehicleLoadRepository.sumQtyByDateAndZone(date, zoneParam);
        long confirmees = vehicleLoadRepository.countConfirmeesByDateAndZone(date, zoneParam);
        long enAttente  = vehicleLoadRepository.countEnAttenteByDateAndZone(date, zoneParam);

        return VehicleLoadKpiDTO.builder()
                .sessions(total)
                .totalLignes(total)
                .totalQte(totalQte)
                .confirmees(confirmees)
                .enAttente(enAttente)
                .build();
    }

    @Transactional(readOnly = true)
    public List<Object[]> getDistinctDatesAndZones() {
        return vehicleLoadRepository.findDistinctDatesAndZones();
    }

    // ─── Vue groupée par (tournée + dépôt) ───────────────────────────────────

    /**
     * Regroupe les sessions de chargement par (deliveryTourId, warehouseFromId).
     * Une ligne par dépôt dans la liste principale, avec le total articles et quantités.
     * Statut du groupe : LOADED si toutes les sessions sont confirmées, DRAFT sinon.
     */
    @Transactional(readOnly = true)
    public List<VehicleLoadGroupDTO> getGroupedByDepot(LocalDate date, String zone) {
        if (date == null) date = LocalDate.now();
        String zoneParam = (zone == null || zone.isBlank()) ? null : zone;

        List<VehicleLoad> sessions = vehicleLoadRepository.findByTourDateAndZone(date, zoneParam);

        // Grouper par (deliveryTourId, warehouseFromId)
        java.util.Map<String, List<VehicleLoad>> byGroup = new java.util.LinkedHashMap<>();
        for (VehicleLoad s : sessions) {
            UUID tourId   = s.getDeliveryTour() != null ? s.getDeliveryTour().getId() : null;
            UUID warehouseId = s.getWarehouseFromId();
            String key = tourId + "||" + warehouseId;
            byGroup.computeIfAbsent(key, k -> new java.util.ArrayList<>()).add(s);
        }

        return byGroup.values().stream().map(group -> {
            VehicleLoad first = group.get(0);
            var tour = first.getDeliveryTour();

            int nbArticles   = group.stream().mapToInt(s -> s.getItems().size()).sum();
            int totalQte     = group.stream()
                    .flatMap(s -> s.getItems().stream())
                    .mapToInt(VehicleLoadItem::getQuantity).sum();
            boolean allLoaded = group.stream()
                    .allMatch(s -> s.getStatus() == VehicleLoad.LoadStatus.LOADED);
            LocalDateTime lastDate = group.stream()
                    .map(VehicleLoad::getLoadDate)
                    .filter(d -> d != null)
                    .max(java.util.Comparator.naturalOrder())
                    .orElse(null);

            return VehicleLoadGroupDTO.builder()
                    .deliveryTourId(tour != null ? tour.getId() : null)
                    .warehouseFromId(first.getWarehouseFromId())
                    .tourDate(tour != null ? tour.getTourDate() : null)
                    .zone(tour != null ? tour.getZone() : null)
                    .representativeId(tour != null ? tour.getRepresentativeId() : null)
                    .vehicleId(tour != null ? tour.getVehicleId() : null)
                    .nbSessions(group.size())
                    .nbArticles(nbArticles)
                    .totalQuantite(totalQte)
                    .lastLoadDate(lastDate)
                    .statut(allLoaded ? "LOADED" : "DRAFT")
                    .sessions(group.stream().map(this::toSessionSummary).toList())
                    .build();
        }).toList();
    }

    private VehicleLoadDTO toSessionSummary(VehicleLoad session) {
        var tour = session.getDeliveryTour();
        return VehicleLoadDTO.builder()
                .id(session.getId())
                .deliveryTourId(tour != null ? tour.getId() : null)
                .tourDate(tour != null ? tour.getTourDate() : null)
                .zone(tour != null ? tour.getZone() : null)
                .representativeId(tour != null ? tour.getRepresentativeId() : null)
                .vehicleId(tour != null ? tour.getVehicleId() : null)
                .loadDate(session.getLoadDate())
                .warehouseFromId(session.getWarehouseFromId())
                .status(session.getStatus() != null ? session.getStatus().name() : null)
                .items(session.getItems() == null ? List.of() :
                        session.getItems().stream().map(item ->
                                VehicleLoadDTO.VehicleLoadItemDTO.builder()
                                        .id(item.getId())
                                        .itemId(item.getItemId())
                                        .quantity(item.getQuantity())
                                        .batchId(item.getBatchId())
                                        .lotNumber(item.getLotNumber())
                                        .expiryDate(item.getExpiryDate())
                                        .build()
                        ).toList())
                .build();
    }

    // ─── Record pour la création d'un item ───────────────────────────────────

    public record VehicleLoadItemRequest(
            UUID itemId,
            Integer quantity,
            UUID batchId,
            String lotNumber,
            LocalDate expiryDate
    ) {}
}
