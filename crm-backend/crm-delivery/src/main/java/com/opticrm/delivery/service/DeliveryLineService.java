package com.opticrm.delivery.service;

import com.opticrm.delivery.dto.CreditCheckDTO;
import com.opticrm.delivery.entity.DeliveryLine;
import com.opticrm.delivery.entity.DeliveryTour;
import com.opticrm.delivery.repository.DeliveryLineRepository;
import com.opticrm.delivery.repository.DeliveryTourRepository;
import com.opticrm.delivery.repository.VehicleLoadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class DeliveryLineService {

    private final DeliveryLineRepository deliveryLineRepository;
    private final DeliveryTourRepository deliveryTourRepository;
    private final VehicleLoadRepository vehicleLoadRepository;
    private final AuditTrailService auditTrailService;
    private final CreditCheckService creditCheckService;
    private final DeliveryPriceService deliveryPriceService;
    private final PromotionService promotionService;

    // ─── Guards ──────────────────────────────────────────────────────────────

    private void assertTourNotClosed(DeliveryTour tour) {
        if (tour.getStatus() == DeliveryTour.TourStatus.CLOSED) {
            throw new IllegalStateException("La tournée est clôturée. Aucune modification n'est autorisée.");
        }
    }

    /**
     * Vérifie que la quantité demandée ne dépasse pas le stock chargé disponible.
     * Règle : chargé (LOADED) - déjà livré (DELIVERED seulement) >= demandé
     * Les visites ABSENT/REFUSED/CLOSED ne consomment pas de stock.
     */
    private void assertStockSuffisant(UUID tourId, UUID itemId, int qtyDemandee, UUID excludeLineId) {
        int loaded = vehicleLoadRepository.sumLoadedQtyByTourAndItem(tourId, itemId);
        if (loaded == 0) {
            throw new IllegalStateException(
                "Article non chargé sur ce véhicule. Chargez l'article avant de créer une ligne de livraison.");
        }
        // N'utilise que les lignes DELIVERED pour le calcul (pas ABSENT/REFUSED/CLOSED/PARTIAL)
        int delivered = excludeLineId == null
            ? deliveryLineRepository.sumDeliveredOnlyQtyByTourAndItem(tourId, itemId)
            : deliveryLineRepository.sumDeliveredQtyByTourAndItemExcluding(tourId, itemId, excludeLineId);
        int disponible = loaded - delivered;
        if (qtyDemandee > disponible) {
            throw new IllegalStateException(
                "Quantité insuffisante : chargé=" + loaded + ", déjà livré=" + delivered +
                ", disponible=" + disponible + ", demandé=" + qtyDemandee);
        }
    }

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    public DeliveryLine addDeliveryLine(UUID tourId, UUID customerId, UUID itemId,
                                        Integer quantity, Integer quantityDelivered,
                                        BigDecimal unitPrice,
                                        BigDecimal discountPercent, String discountReason,
                                        String paymentMode, BigDecimal paidAmount,
                                        String visitResult, String visitNotes,
                                        String chequeNumber, LocalDate traiteDueDate,
                                        UUID batchId, String lotNumber, LocalDate expiryDate) {
        log.debug("Adding delivery line for tour: {}", tourId);

        DeliveryTour tour = deliveryTourRepository.findById(tourId)
                .orElseThrow(() -> new IllegalArgumentException("Tour not found"));
        assertTourNotClosed(tour);

        DeliveryLine.VisitResult vr = visitResult != null
            ? DeliveryLine.VisitResult.valueOf(visitResult)
            : DeliveryLine.VisitResult.DELIVERED;

        // Déterminer la quantité effectivement livrée
        int effectiveQtyDelivered = 0;
        if (vr == DeliveryLine.VisitResult.DELIVERED) {
            effectiveQtyDelivered = quantity != null ? quantity : 0;
        } else if (vr == DeliveryLine.VisitResult.PARTIAL) {
            effectiveQtyDelivered = quantityDelivered != null ? quantityDelivered : 0;
            if (effectiveQtyDelivered > (quantity != null ? quantity : 0)) {
                throw new IllegalArgumentException(
                    "quantityDelivered ne peut pas dépasser quantity pour une livraison PARTIAL.");
            }
        }

        // Stock check uniquement si livraison effective
        if (vr == DeliveryLine.VisitResult.DELIVERED || vr == DeliveryLine.VisitResult.PARTIAL) {
            assertStockSuffisant(tourId, itemId, effectiveQtyDelivered, null);
        }

        // Résolution du prix : si non fourni, utiliser la hiérarchie tarifaire
        BigDecimal resolvedPrice = unitPrice;
        if (resolvedPrice == null || resolvedPrice.compareTo(BigDecimal.ZERO) == 0) {
            resolvedPrice = deliveryPriceService.resolvePrice(customerId, itemId).unitPrice();
        }

        // Appliquer la remise éventuelle
        BigDecimal effectiveDiscount = (discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0)
            ? discountPercent : BigDecimal.ZERO;
        if (effectiveDiscount.compareTo(BigDecimal.ZERO) > 0 && resolvedPrice != null) {
            resolvedPrice = resolvedPrice.multiply(
                BigDecimal.ONE.subtract(effectiveDiscount.divide(BigDecimal.valueOf(100))));
        }

        // Montant calculé sur la quantité réellement livrée
        BigDecimal amount = (resolvedPrice != null && effectiveQtyDelivered > 0)
            ? resolvedPrice.multiply(BigDecimal.valueOf(effectiveQtyDelivered))
            : BigDecimal.ZERO;

        DeliveryLine.PaymentMode pm = paymentMode != null
            ? DeliveryLine.PaymentMode.valueOf(paymentMode)
            : DeliveryLine.PaymentMode.CASH;

        // Contrôle crédit pour les ventes à crédit
        if (pm == DeliveryLine.PaymentMode.CREDIT && customerId != null) {
            CreditCheckDTO check = creditCheckService.check(customerId, amount);
            if (!check.isApproved()) {
                throw new IllegalStateException("Vente à crédit refusée : " + check.getReason());
            }
        }

        DeliveryLine line = DeliveryLine.builder()
                .deliveryTour(tour)
                .customerId(customerId)
                .itemId(itemId)
                .quantity(quantity != null ? quantity : 0)
                .quantityDelivered(effectiveQtyDelivered)
                .unitPrice(resolvedPrice != null ? resolvedPrice : BigDecimal.ZERO)
                .discountPercent(effectiveDiscount)
                .discountReason(discountReason)
                .amount(amount)
                .paymentMode(pm)
                .paidAmount(paidAmount != null ? paidAmount : BigDecimal.ZERO)
                .visitResult(vr)
                .visitNotes(visitNotes)
                .chequeNumber(chequeNumber)
                .traiteDueDate(traiteDueDate)
                .batchId(batchId)
                .lotNumber(lotNumber)
                .expiryDate(expiryDate)
                .build();

        DeliveryLine saved = deliveryLineRepository.save(line);

        // Appliquer les promotions (gratuités) automatiquement
        promotionService.applyPromotions(saved, tour.getZone());

        auditTrailService.logAction("ADD_DELIVERY_LINE", "DeliveryLine", saved.getId(), null,
            "Line added: " + vr + ", qty=" + quantity + (lotNumber != null ? ", lot=" + lotNumber : ""));
        return saved;
    }

    public DeliveryLine updateDeliveryLine(UUID lineId, Integer quantity, Integer quantityDelivered,
                                           BigDecimal unitPrice,
                                           BigDecimal discountPercent, String discountReason,
                                           String paymentMode, BigDecimal paidAmount,
                                           String visitResult, String visitNotes,
                                           String chequeNumber, LocalDate traiteDueDate,
                                           UUID batchId, String lotNumber, LocalDate expiryDate) {
        log.debug("Updating delivery line: {}", lineId);

        DeliveryLine line = deliveryLineRepository.findById(lineId)
                .orElseThrow(() -> new IllegalArgumentException("Delivery line not found"));
        assertTourNotClosed(line.getDeliveryTour());

        DeliveryLine.VisitResult vr = visitResult != null
            ? DeliveryLine.VisitResult.valueOf(visitResult)
            : line.getVisitResult();

        int effectiveQtyDelivered = 0;
        if (vr == DeliveryLine.VisitResult.DELIVERED) {
            effectiveQtyDelivered = quantity != null ? quantity : line.getQuantity();
        } else if (vr == DeliveryLine.VisitResult.PARTIAL) {
            effectiveQtyDelivered = quantityDelivered != null ? quantityDelivered
                : (line.getQuantityDelivered() != null ? line.getQuantityDelivered() : 0);
        }

        if (vr == DeliveryLine.VisitResult.DELIVERED || vr == DeliveryLine.VisitResult.PARTIAL) {
            assertStockSuffisant(line.getDeliveryTour().getId(), line.getItemId(), effectiveQtyDelivered, lineId);
        }

        BigDecimal resolvedPrice = (unitPrice != null && unitPrice.compareTo(BigDecimal.ZERO) > 0)
            ? unitPrice
            : deliveryPriceService.resolvePrice(line.getCustomerId(), line.getItemId()).unitPrice();

        BigDecimal effectiveDiscount = (discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0)
            ? discountPercent : line.getDiscountPercent();
        if (effectiveDiscount != null && effectiveDiscount.compareTo(BigDecimal.ZERO) > 0) {
            resolvedPrice = resolvedPrice.multiply(
                BigDecimal.ONE.subtract(effectiveDiscount.divide(BigDecimal.valueOf(100))));
        }

        DeliveryLine.PaymentMode pm = paymentMode != null
            ? DeliveryLine.PaymentMode.valueOf(paymentMode)
            : line.getPaymentMode();

        BigDecimal newAmount = resolvedPrice.multiply(BigDecimal.valueOf(effectiveQtyDelivered));

        if (pm == DeliveryLine.PaymentMode.CREDIT && line.getCustomerId() != null) {
            CreditCheckDTO check = creditCheckService.check(line.getCustomerId(), newAmount);
            if (!check.isApproved()) {
                throw new IllegalStateException("Vente à crédit refusée : " + check.getReason());
            }
        }

        line.setQuantity(quantity != null ? quantity : line.getQuantity());
        line.setQuantityDelivered(effectiveQtyDelivered);
        line.setUnitPrice(resolvedPrice);
        line.setDiscountPercent(effectiveDiscount != null ? effectiveDiscount : BigDecimal.ZERO);
        if (discountReason != null) line.setDiscountReason(discountReason);
        line.setAmount(newAmount);
        line.setPaymentMode(pm);
        line.setPaidAmount(paidAmount != null ? paidAmount : BigDecimal.ZERO);
        line.setVisitResult(vr);
        line.setVisitNotes(visitNotes);
        line.setChequeNumber(chequeNumber);
        line.setTraiteDueDate(traiteDueDate);
        if (batchId != null) line.setBatchId(batchId);
        if (lotNumber != null) line.setLotNumber(lotNumber);
        if (expiryDate != null) line.setExpiryDate(expiryDate);

        DeliveryLine updated = deliveryLineRepository.save(line);

        // Recalculer les promotions si la quantité a changé
        promotionService.applyPromotions(updated, updated.getDeliveryTour().getZone());

        auditTrailService.logAction("UPDATE_DELIVERY_LINE", "DeliveryLine", updated.getId(), null,
            "Line updated: " + vr);
        return updated;
    }

    public List<DeliveryLine> getDeliveryLinesByTour(UUID tourId) {
        return deliveryLineRepository.findByDeliveryTourId(tourId);
    }

    public DeliveryLine getDeliveryLine(UUID lineId) {
        return deliveryLineRepository.findById(lineId)
                .orElseThrow(() -> new IllegalArgumentException("Delivery line not found"));
    }

    public void deleteDeliveryLine(UUID lineId) {
        log.debug("Deleting delivery line: {}", lineId);
        DeliveryLine line = deliveryLineRepository.findById(lineId)
                .orElseThrow(() -> new IllegalArgumentException("Delivery line not found"));
        assertTourNotClosed(line.getDeliveryTour());
        deliveryLineRepository.deleteById(lineId);
        auditTrailService.logAction("DELETE_DELIVERY_LINE", "DeliveryLine", lineId, null, "Line deleted");
    }

    // ─── Stock disponible ─────────────────────────────────────────────────────

    /**
     * Retourne le stock disponible par article pour une tournée.
     * disponible = chargé (LOADED) - livré (DELIVERED uniquement)
     */
    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getAvailableStock(UUID tourId) {
        List<com.opticrm.delivery.entity.VehicleLoad> loads =
            vehicleLoadRepository.findByDeliveryTourId(tourId);

        java.util.Map<UUID, Integer> loadedByItem = new java.util.HashMap<>();
        for (var session : loads) {
            if (session.getStatus() == com.opticrm.delivery.entity.VehicleLoad.LoadStatus.LOADED) {
                for (var item : session.getItems()) {
                    loadedByItem.merge(item.getItemId(), item.getQuantity(), Integer::sum);
                }
            }
        }

        // Seules les lignes DELIVERED consomment le stock
        java.util.Map<UUID, Integer> deliveredByItem = new java.util.HashMap<>();
        for (UUID itemId : loadedByItem.keySet()) {
            int qty = deliveryLineRepository.sumDeliveredOnlyQtyByTourAndItem(tourId, itemId);
            if (qty > 0) deliveredByItem.put(itemId, qty);
        }

        return loadedByItem.entrySet().stream().map(e -> {
            UUID itemId2 = e.getKey();
            int loaded = e.getValue();
            int delivered = deliveredByItem.getOrDefault(itemId2, 0);
            java.util.Map<String, Object> row = new java.util.HashMap<>();
            row.put("itemId",    itemId2.toString());
            row.put("loaded",    loaded);
            row.put("delivered", delivered);
            row.put("available", Math.max(0, loaded - delivered));
            return row;
        }).collect(java.util.stream.Collectors.toList());
    }

    // ─── Crédit encours ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public BigDecimal getOutstandingCredit(UUID customerId) {
        return deliveryLineRepository.sumOutstandingCreditByCustomer(customerId);
    }

    @Transactional(readOnly = true)
    public BigDecimal getOutstandingCreditExcludingTour(UUID customerId, UUID excludeTourId) {
        return deliveryLineRepository.sumOutstandingCreditByCustomerExcludingTour(customerId, excludeTourId);
    }
}
