package com.opticrm.delivery.service;

import com.opticrm.delivery.entity.ProductBatch;
import com.opticrm.delivery.repository.ProductBatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service FEFO (First Expired, First Out).
 * Sélectionne les lots à prélever en prioritisant ceux qui expirent le plus tôt.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class FefoService {

    private final ProductBatchRepository batchRepository;

    /**
     * Suggère les lots à prélever pour servir une quantité donnée (règle FEFO).
     * @param itemId      Article à charger
     * @param warehouseId Entrepôt source (null = tous entrepôts)
     * @param qty         Quantité totale requise
     * @return Liste de suggestions de prélèvement lot par lot
     */
    public List<PickSuggestion> suggestPicks(UUID itemId, UUID warehouseId, int qty) {
        List<ProductBatch> batches = batchRepository.findFefoByItem(itemId, warehouseId);

        List<PickSuggestion> picks = new ArrayList<>();
        int remaining = qty;

        for (ProductBatch batch : batches) {
            if (remaining <= 0) break;

            int available = batch.getQuantity();
            if (available <= 0) continue;

            int toPick = Math.min(available, remaining);
            remaining -= toPick;

            String alert = "OK";
            if (batch.getExpiryDate() != null) {
                long days = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), batch.getExpiryDate());
                if (days < 0)        alert = "EXPIRED";
                else if (days <= 7)  alert = "CRITICAL";
                else if (days <= 30) alert = "WARNING";
            }

            picks.add(new PickSuggestion(
                batch.getId(),
                batch.getBatchNumber(),
                batch.getExpiryDate(),
                toPick,
                available,
                alert
            ));
        }

        if (remaining > 0) {
            log.warn("Stock insuffisant pour article {} : manque {} unité(s)", itemId, remaining);
        }

        return picks;
    }

    /**
     * Retourne le lot recommandé (premier FEFO) pour un article.
     * Utilisé lors de la création d'une ligne de livraison.
     */
    public ProductBatch suggestFirstBatch(UUID itemId, UUID warehouseId) {
        List<ProductBatch> batches = batchRepository.findFefoByItem(itemId, warehouseId);
        return batches.isEmpty() ? null : batches.get(0);
    }

    public record PickSuggestion(
        UUID batchId,
        String batchNumber,
        LocalDate expiryDate,
        int quantityToPick,
        int quantityAvailable,
        String expiryAlert
    ) {}
}
