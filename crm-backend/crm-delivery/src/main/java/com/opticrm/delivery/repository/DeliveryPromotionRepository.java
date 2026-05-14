package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.DeliveryPromotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DeliveryPromotionRepository extends JpaRepository<DeliveryPromotion, UUID> {

    /** Promotions actives pour un article donné à une date donnée, avec filtre zone optionnel */
    @Query("SELECT p FROM DeliveryPromotion p " +
           "WHERE p.itemId = :itemId " +
           "AND p.isActive = true " +
           "AND (p.validFrom IS NULL OR p.validFrom <= :today) " +
           "AND (p.validTo IS NULL OR p.validTo >= :today) " +
           "AND (p.zone IS NULL OR p.zone = :zone OR :zone IS NULL)")
    List<DeliveryPromotion> findActiveForItem(UUID itemId, LocalDate today, String zone);

    List<DeliveryPromotion> findByItemId(UUID itemId);

    List<DeliveryPromotion> findByIsActiveTrue();
}
