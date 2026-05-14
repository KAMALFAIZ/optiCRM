package com.opticrm.delivery.service;

import com.opticrm.delivery.dto.PreOrderDTO;
import com.opticrm.delivery.entity.*;
import com.opticrm.delivery.repository.*;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class PreOrderService {

    private final PreOrderRepository preOrderRepository;
    private final DeliveryTourRepository deliveryTourRepository;
    private final VehicleLoadRepository vehicleLoadRepository;
    private final AccountRepository accountRepository;
    private final AuditTrailService auditTrailService;

    // ── CRUD ─────────────────────────────────────────────────────────────────

    public PreOrder create(PreOrderDTO dto) {
        // La tournée est optionnelle pour les commandes prévisionnelles
        if (dto.getDeliveryTourId() != null) {
            DeliveryTour tour = deliveryTourRepository.findById(dto.getDeliveryTourId())
                .orElseThrow(() -> new IllegalArgumentException("Tournée introuvable"));
            if (tour.getStatus() == DeliveryTour.TourStatus.CLOSED)
                throw new IllegalStateException("Impossible d'ajouter une commande sur une tournée clôturée.");
        }

        PreOrder order = PreOrder.builder()
            .deliveryTourId(dto.getDeliveryTourId())
            .customerId(dto.getCustomerId())
            .scheduledDate(dto.getScheduledDate())
            .status(PreOrder.PreOrderStatus.PENDING)
            .notes(dto.getNotes())
            .items(new ArrayList<>())
            .build();
        PreOrder saved = preOrderRepository.save(order);

        if (dto.getItems() != null) {
            for (PreOrderDTO.PreOrderItemDTO item : dto.getItems()) {
                saved.getItems().add(PreOrderItem.builder()
                    .preOrder(saved)
                    .itemId(item.getItemId())
                    .quantityOrdered(item.getQuantityOrdered() != null ? item.getQuantityOrdered() : 0)
                    .quantityConfirmed(0)
                    .unitPrice(item.getUnitPrice())
                    .build());
            }
            saved = preOrderRepository.save(saved);
        }

        auditTrailService.logAction("CREATE_PREORDER", "PreOrder", saved.getId(), null,
            "Commande créée pour client " + dto.getCustomerId());
        return saved;
    }

    public PreOrder confirm(UUID preOrderId) {
        PreOrder order = preOrderRepository.findById(preOrderId)
            .orElseThrow(() -> new IllegalArgumentException("Commande introuvable"));
        if (order.getStatus() != PreOrder.PreOrderStatus.PENDING)
            throw new IllegalStateException("Seules les commandes PENDING peuvent être confirmées.");

        // Confirmer les quantités (confirmed = ordered par défaut)
        if (order.getItems() != null) {
            order.getItems().forEach(i -> i.setQuantityConfirmed(i.getQuantityOrdered()));
        }
        order.setStatus(PreOrder.PreOrderStatus.CONFIRMED);
        PreOrder confirmed = preOrderRepository.save(order);

        // Générer automatiquement les VehicleLoad pour cette tournée
        generateLoadsFromOrders(order.getDeliveryTourId());

        auditTrailService.logAction("CONFIRM_PREORDER", "PreOrder", confirmed.getId(), null, "Commande confirmée");
        return confirmed;
    }

    public PreOrder cancel(UUID preOrderId) {
        PreOrder order = preOrderRepository.findById(preOrderId)
            .orElseThrow(() -> new IllegalArgumentException("Commande introuvable"));
        if (order.getStatus() == PreOrder.PreOrderStatus.DELIVERED)
            throw new IllegalStateException("Impossible d'annuler une commande déjà livrée.");
        order.setStatus(PreOrder.PreOrderStatus.CANCELLED);
        return preOrderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public List<PreOrder> getByTour(UUID tourId) {
        return preOrderRepository.findByDeliveryTourId(tourId);
    }

    @Transactional(readOnly = true)
    public PreOrder getById(UUID id) {
        return preOrderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Commande introuvable"));
    }

    public void delete(UUID id) {
        PreOrder order = preOrderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Commande introuvable"));
        if (order.getStatus() == PreOrder.PreOrderStatus.CONFIRMED
                || order.getStatus() == PreOrder.PreOrderStatus.DELIVERED)
            throw new IllegalStateException("Impossible de supprimer une commande confirmée ou livrée.");
        preOrderRepository.deleteById(id);
    }

    /** Commandes prévisionnelles sans tournée affectée */
    @Transactional(readOnly = true)
    public List<PreOrder> getPendingUnscheduled() {
        return preOrderRepository.findPendingUnscheduled();
    }

    /** Commandes actives pour un client (pour planifier la prochaine visite) */
    @Transactional(readOnly = true)
    public List<PreOrder> getActiveByCustomer(UUID customerId) {
        return preOrderRepository.findActiveByCustomer(customerId);
    }

    /**
     * Rattache une commande prévisionnelle à une tournée existante.
     * Appelé quand le gestionnaire planifie la commande dans une tournée.
     */
    public PreOrder assignToTour(UUID preOrderId, UUID tourId) {
        PreOrder order = preOrderRepository.findById(preOrderId)
            .orElseThrow(() -> new IllegalArgumentException("Commande introuvable"));
        if (order.getStatus() != PreOrder.PreOrderStatus.PENDING)
            throw new IllegalStateException("Seules les commandes PENDING peuvent être rattachées.");
        DeliveryTour tour = deliveryTourRepository.findById(tourId)
            .orElseThrow(() -> new IllegalArgumentException("Tournée introuvable"));
        if (tour.getStatus() == DeliveryTour.TourStatus.CLOSED)
            throw new IllegalStateException("La tournée est clôturée.");
        order.setDeliveryTourId(tourId);
        return preOrderRepository.save(order);
    }

    /**
     * Génère une demande de réapprovisionnement depuis les commandes confirmées non rattachées.
     * Agrège toutes les commandes CONFIRMED pour produire une liste consolidée par article.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> buildReplenishmentDemand() {
        List<PreOrder> orders = preOrderRepository.findPendingUnscheduled().stream()
            .filter(o -> o.getStatus() == PreOrder.PreOrderStatus.CONFIRMED)
            .toList();

        Map<UUID, Integer> qtyByItem = new LinkedHashMap<>();
        for (PreOrder o : orders) {
            if (o.getItems() == null) continue;
            for (PreOrderItem i : o.getItems()) {
                qtyByItem.merge(i.getItemId(), i.getQuantityConfirmed(), Integer::sum);
            }
        }

        return qtyByItem.entrySet().stream().map(e -> {
            Map<String, Object> row = new java.util.HashMap<>();
            row.put("itemId", e.getKey().toString());
            row.put("totalQuantity", e.getValue());
            return row;
        }).toList();
    }

    // ── Séquencement itinéraire ───────────────────────────────────────────────

    /**
     * Applique un ordre de visite explicite à une liste de commandes.
     * Le gestionnaire fournit la séquence souhaitée.
     */
    public List<PreOrder> applyVisitOrder(UUID tourId, List<UUID> orderedPreOrderIds) {
        List<PreOrder> orders = preOrderRepository.findByDeliveryTourId(tourId);
        Map<UUID, PreOrder> byId = new HashMap<>();
        for (PreOrder o : orders) byId.put(o.getId(), o);

        List<PreOrder> updated = new ArrayList<>();
        for (int i = 0; i < orderedPreOrderIds.size(); i++) {
            UUID id = orderedPreOrderIds.get(i);
            PreOrder order = byId.get(id);
            if (order == null) throw new IllegalArgumentException("Commande introuvable dans cette tournée : " + id);
            order.setVisitOrder(i + 1);
            updated.add(preOrderRepository.save(order));
        }
        auditTrailService.logAction("SEQUENCE_TOUR", "PreOrder", tourId, null,
            orderedPreOrderIds.size() + " arrêt(s) séquencé(s)");
        return updated;
    }

    /**
     * Séquencement automatique basé sur les coordonnées GPS des clients.
     * Algorithme nearest-neighbour depuis le premier client de la liste.
     * Nécessite que les comptes (Account) aient des coordonnées latitude/longitude.
     */
    public List<PreOrder> autoSequence(UUID tourId) {
        List<PreOrder> orders = preOrderRepository.findByDeliveryTourId(tourId).stream()
            .filter(o -> o.getStatus() != PreOrder.PreOrderStatus.CANCELLED)
            .collect(java.util.stream.Collectors.toCollection(ArrayList::new));

        if (orders.size() <= 1) return orders;

        // Charger les coordonnées GPS des clients
        Map<UUID, double[]> coords = new HashMap<>();
        for (PreOrder o : orders) {
            accountRepository.findById(o.getCustomerId()).ifPresent(acc -> {
                if (acc.getLatitude() != null && acc.getLongitude() != null) {
                    coords.put(o.getCustomerId(), new double[]{
                        acc.getLatitude().doubleValue(),
                        acc.getLongitude().doubleValue()
                    });
                }
            });
        }

        // Si moins de 2 clients ont des coordonnées, on ne peut pas optimiser
        long withCoords = orders.stream().filter(o -> coords.containsKey(o.getCustomerId())).count();
        if (withCoords < 2) {
            log.warn("Séquencement auto impossible : moins de 2 clients avec coordonnées GPS.");
            return orders;
        }

        // Nearest-neighbour : partir du premier, toujours aller au plus proche non visité
        List<PreOrder> sequenced = new ArrayList<>();
        List<PreOrder> remaining = new ArrayList<>(orders);

        PreOrder current = remaining.remove(0);
        sequenced.add(current);

        while (!remaining.isEmpty()) {
            double[] currentCoords = coords.get(current.getCustomerId());
            PreOrder nearest = null;
            double minDist = Double.MAX_VALUE;

            for (PreOrder candidate : remaining) {
                double[] candidateCoords = coords.get(candidate.getCustomerId());
                if (currentCoords != null && candidateCoords != null) {
                    double dist = haversineKm(currentCoords[0], currentCoords[1],
                                              candidateCoords[0], candidateCoords[1]);
                    if (dist < minDist) { minDist = dist; nearest = candidate; }
                }
            }

            if (nearest == null) nearest = remaining.get(0);
            remaining.remove(nearest);
            sequenced.add(nearest);
            current = nearest;
        }

        // Persister l'ordre calculé
        List<PreOrder> result = new ArrayList<>();
        for (int i = 0; i < sequenced.size(); i++) {
            PreOrder o = sequenced.get(i);
            o.setVisitOrder(i + 1);
            result.add(preOrderRepository.save(o));
        }
        auditTrailService.logAction("AUTO_SEQUENCE_TOUR", "PreOrder", tourId, null,
            "Séquencement automatique : " + result.size() + " arrêts optimisés");
        return result;
    }

    /** Distance en km (formule haversine simplifiée) */
    private static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    @Transactional(readOnly = true)
    public List<PreOrder> getByTourOrdered(UUID tourId) {
        return preOrderRepository.findByDeliveryTourId(tourId).stream()
            .sorted(Comparator.comparingInt(o -> (o.getVisitOrder() != null ? o.getVisitOrder() : Integer.MAX_VALUE)))
            .toList();
    }

    // ── Génération chargement ─────────────────────────────────────────────────

    /**
     * Agrège toutes les commandes CONFIRMED de la tournée par article
     * et crée/met à jour les VehicleLoad correspondants.
     */
    private void generateLoadsFromOrders(UUID tourId) {
        DeliveryTour tour = deliveryTourRepository.findById(tourId).orElseThrow();
        List<PreOrder> confirmed = preOrderRepository
            .findByDeliveryTourIdAndStatus(tourId, PreOrder.PreOrderStatus.CONFIRMED);

        // Agréger par article
        Map<UUID, Integer> qtyByItem = new HashMap<>();
        Map<UUID, BigDecimal> priceByItem = new HashMap<>();
        for (PreOrder po : confirmed) {
            if (po.getItems() == null) continue;
            for (PreOrderItem item : po.getItems()) {
                qtyByItem.merge(item.getItemId(), item.getQuantityConfirmed(), Integer::sum);
                if (item.getUnitPrice() != null && !priceByItem.containsKey(item.getItemId())) {
                    priceByItem.put(item.getItemId(), item.getUnitPrice());
                }
            }
        }

        // Créer les VehicleLoad manquants
        List<VehicleLoad> existing = vehicleLoadRepository.findByDeliveryTourId(tourId);
        Set<UUID> existingItems = new HashSet<>();
        for (VehicleLoad vl : existing) {
            for (VehicleLoadItem item : vl.getItems()) {
                existingItems.add(item.getItemId());
            }
        }

        for (Map.Entry<UUID, Integer> e : qtyByItem.entrySet()) {
            if (!existingItems.contains(e.getKey())) {
                VehicleLoadItem item = VehicleLoadItem.builder()
                    .itemId(e.getKey())
                    .quantity(e.getValue())
                    .build();
                VehicleLoad vl = VehicleLoad.builder()
                    .deliveryTour(tour)
                    .status(VehicleLoad.LoadStatus.DRAFT)
                    .items(new java.util.ArrayList<>(java.util.List.of(item)))
                    .build();
                item.setVehicleLoad(vl);
                vehicleLoadRepository.save(vl);
                log.info("VehicleLoad généré automatiquement: article={}, qté={}", e.getKey(), e.getValue());
            }
        }
    }
}
