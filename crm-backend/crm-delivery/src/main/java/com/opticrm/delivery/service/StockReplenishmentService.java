package com.opticrm.delivery.service;

import com.opticrm.delivery.entity.StockReplenishment;
import com.opticrm.delivery.entity.StockReplenishmentItem;
import com.opticrm.delivery.entity.VehicleLoad;
import com.opticrm.delivery.repository.StockReplenishmentRepository;
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
public class StockReplenishmentService {

    private final StockReplenishmentRepository replenishmentRepository;
    private final VehicleLoadService vehicleLoadService;
    private final AuditTrailService auditTrailService;

    public StockReplenishment createReplenishment(
            StockReplenishment.SourceType sourceType,
            UUID sourceId,
            StockReplenishment.TargetType targetType,
            UUID targetId,
            StockReplenishment.Motive motive,
            List<StockReplenishmentItem> items) {

        log.info("Creating stock replenishment: {} -> {}", sourceType, targetType);

        StockReplenishment replenishment = StockReplenishment.builder()
                .sourceType(sourceType)
                .sourceId(sourceId)
                .targetType(targetType)
                .targetId(targetId)
                .motive(motive)
                .requestDate(LocalDateTime.now())
                .status(StockReplenishment.ReplenishmentStatus.PENDING)
                .build();

        replenishment = replenishmentRepository.save(replenishment);

        for (StockReplenishmentItem item : items) {
            item.setReplenishment(replenishment);
        }
        replenishment.setItems(items);

        StockReplenishment saved = replenishmentRepository.save(replenishment);
        auditTrailService.logAction("Create", "StockReplenishment", saved.getId(), null,
                "Demande de réapprov créée: " + motive.getLabel());
        return saved;
    }

    public void approveReplenishment(UUID replenishmentId, UUID approvedByUserId) {
        log.info("Approving replenishment: {}", replenishmentId);

        StockReplenishment replenishment = replenishmentRepository.findById(replenishmentId)
                .orElseThrow(() -> new RuntimeException("Replenishment not found"));

        replenishment.setStatus(StockReplenishment.ReplenishmentStatus.APPROVED);
        replenishment.setApprovedBy(approvedByUserId);
        replenishment.setApprovalDate(LocalDateTime.now());

        replenishmentRepository.save(replenishment);
        auditTrailService.logAction("Approve", "StockReplenishment", replenishmentId, approvedByUserId,
                "Demande approuvée");
    }

    public void applyReplenishment(UUID replenishmentId) {
        log.info("Applying replenishment: {}", replenishmentId);

        StockReplenishment replenishment = replenishmentRepository.findById(replenishmentId)
                .orElseThrow(() -> new RuntimeException("Replenishment not found"));

        if (replenishment.getStatus() != StockReplenishment.ReplenishmentStatus.APPROVED) {
            throw new RuntimeException("Replenishment must be approved before applying");
        }

        replenishment.setStatus(StockReplenishment.ReplenishmentStatus.APPLIED);
        replenishmentRepository.save(replenishment);

        auditTrailService.logAction("Apply", "StockReplenishment", replenishmentId, null,
                "Stock mis à jour");
    }

    public List<StockReplenishment> listAllReplenishments() {
        return replenishmentRepository.findAll();
    }

    public List<StockReplenishment> listPendingReplenishments() {
        return replenishmentRepository.findByStatus(StockReplenishment.ReplenishmentStatus.PENDING);
    }

    public List<StockReplenishment> listByStatus(StockReplenishment.ReplenishmentStatus status) {
        return replenishmentRepository.findByStatus(status);
    }

    public List<StockReplenishment> listReplenishmentsByMotive(StockReplenishment.Motive motive) {
        return replenishmentRepository.findByMotive(motive);
    }

    public StockReplenishment getReplenishment(UUID replenishmentId) {
        return replenishmentRepository.findById(replenishmentId)
                .orElseThrow(() -> new RuntimeException("Replenishment not found"));
    }

    /**
     * Transfère un réapprovisionnement approuvé vers une session de chargement véhicule.
     * - Les articles du réappro deviennent les lignes de la session VehicleLoad.
     * - Si targetType=DELIVERY, targetId est utilisé comme tourId.
     *   Sinon, un tourId explicite doit être fourni.
     * - Si sourceType=WAREHOUSE, sourceId est utilisé comme warehouseFromId.
     */
    public VehicleLoad transferToLoad(UUID replenishmentId, UUID overrideTourId) {
        StockReplenishment reappro = replenishmentRepository.findById(replenishmentId)
                .orElseThrow(() -> new RuntimeException("Réapprovisionnement introuvable"));

        if (reappro.getStatus() != StockReplenishment.ReplenishmentStatus.APPROVED) {
            throw new IllegalStateException("Seuls les réapprovisionnements APPROVED peuvent être transférés.");
        }
        if (reappro.getItems() == null || reappro.getItems().isEmpty()) {
            throw new IllegalStateException("Le réapprovisionnement ne contient aucun article.");
        }

        UUID tourId = reappro.getTargetType() == StockReplenishment.TargetType.DELIVERY
                ? reappro.getTargetId()
                : overrideTourId;
        if (tourId == null) {
            throw new IllegalArgumentException("Aucune tournée cible — fournissez un tourId.");
        }

        UUID warehouseFromId = reappro.getSourceType() == StockReplenishment.SourceType.WAREHOUSE
                ? reappro.getSourceId()
                : null;

        List<VehicleLoadService.VehicleLoadItemRequest> itemRequests = reappro.getItems().stream()
                .map(i -> new VehicleLoadService.VehicleLoadItemRequest(
                        i.getItemId(), i.getQuantity(), null, null, null))
                .toList();

        VehicleLoad session = vehicleLoadService.createSession(tourId, warehouseFromId, itemRequests);

        reappro.setStatus(StockReplenishment.ReplenishmentStatus.TRANSFERRED);
        replenishmentRepository.save(reappro);

        auditTrailService.logAction("TRANSFER_TO_LOAD", "StockReplenishment", replenishmentId, null,
                "Transféré vers session VehicleLoad " + session.getId());
        log.info("Réappro {} transféré vers VehicleLoad session {}", replenishmentId, session.getId());
        return session;
    }
}
