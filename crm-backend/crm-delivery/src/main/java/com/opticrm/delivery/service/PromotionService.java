package com.opticrm.delivery.service;

import com.opticrm.delivery.entity.DeliveryLine;
import com.opticrm.delivery.entity.DeliveryLineBonus;
import com.opticrm.delivery.entity.DeliveryPromotion;
import com.opticrm.delivery.repository.DeliveryLineBonusRepository;
import com.opticrm.delivery.repository.DeliveryPromotionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class PromotionService {

    private final DeliveryPromotionRepository promotionRepository;
    private final DeliveryLineBonusRepository bonusRepository;

    // ── CRUD promotions ───────────────────────────────────────────────────────

    public DeliveryPromotion create(DeliveryPromotion promo) {
        return promotionRepository.save(promo);
    }

    public DeliveryPromotion update(UUID id, DeliveryPromotion dto) {
        DeliveryPromotion p = promotionRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Promotion introuvable"));
        p.setName(dto.getName());
        p.setDescription(dto.getDescription());
        p.setItemId(dto.getItemId());
        p.setMinQuantity(dto.getMinQuantity());
        p.setBonusItemId(dto.getBonusItemId());
        p.setBonusQuantity(dto.getBonusQuantity());
        p.setZone(dto.getZone());
        p.setValidFrom(dto.getValidFrom());
        p.setValidTo(dto.getValidTo());
        p.setIsActive(dto.getIsActive());
        return promotionRepository.save(p);
    }

    public void delete(UUID id) {
        promotionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<DeliveryPromotion> getAll() {
        return promotionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<DeliveryPromotion> getActive() {
        return promotionRepository.findByIsActiveTrue();
    }

    // ── Application automatique lors d'une livraison ──────────────────────────

    /**
     * Calcule et enregistre les lignes gratuites pour une ligne de livraison.
     * Appelé après la création ou modification d'une DeliveryLine.
     * Les bonus existants sont d'abord supprimés puis recalculés.
     *
     * @param line  La ligne de livraison qui déclenche les promos
     * @param zone  La zone de la tournée (pour filtrage)
     */
    public List<DeliveryLineBonus> applyPromotions(DeliveryLine line, String zone) {
        if (line.getVisitResult() != DeliveryLine.VisitResult.DELIVERED
                && line.getVisitResult() != DeliveryLine.VisitResult.PARTIAL) {
            return List.of();
        }

        // Supprimer les bonus précédents pour cette ligne
        bonusRepository.deleteByDeliveryLineId(line.getId());

        int qty = line.getQuantity() != null ? line.getQuantity() : 0;
        if (qty == 0) return List.of();

        List<DeliveryPromotion> promos = promotionRepository
            .findActiveForItem(line.getItemId(), LocalDate.now(), zone);

        List<DeliveryLineBonus> created = new ArrayList<>();

        for (DeliveryPromotion promo : promos) {
            if (qty < promo.getMinQuantity()) continue;

            // Calcul du nombre de paliers déclenchés (ex: 20 unités, palier à 10 → 2 fois)
            int paliers = qty / promo.getMinQuantity();
            int bonusQty = paliers * promo.getBonusQuantity();

            DeliveryLineBonus bonus = DeliveryLineBonus.builder()
                .deliveryLine(line)
                .promotion(promo)
                .bonusItemId(promo.getBonusItemId())
                .bonusQuantity(bonusQty)
                .build();

            created.add(bonusRepository.save(bonus));
            log.info("Bonus appliqué: promo={}, article={}, qté={}", promo.getName(), promo.getBonusItemId(), bonusQty);
        }

        return created;
    }

    @Transactional(readOnly = true)
    public List<DeliveryLineBonus> getBonusesForLine(UUID lineId) {
        return bonusRepository.findByDeliveryLineId(lineId);
    }
}
