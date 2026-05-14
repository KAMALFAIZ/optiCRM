package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.DeliveryPriceOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeliveryPriceOverrideRepository extends JpaRepository<DeliveryPriceOverride, UUID> {

    // Prix client-spécifique valide aujourd'hui (priorité 1)
    @Query("SELECT p FROM DeliveryPriceOverride p " +
           "WHERE p.customerId = :customerId AND p.itemId = :itemId " +
           "AND p.isActive = true " +
           "AND (p.validFrom IS NULL OR p.validFrom <= :today) " +
           "AND (p.validTo IS NULL OR p.validTo >= :today) " +
           "ORDER BY p.createdAt DESC")
    List<DeliveryPriceOverride> findClientPrice(UUID customerId, UUID itemId, LocalDate today);

    // Prix par catégorie tarifaire valide aujourd'hui (priorité 2)
    @Query("SELECT p FROM DeliveryPriceOverride p " +
           "WHERE p.pricingCategoryId = :categoryId AND p.itemId = :itemId " +
           "AND p.customerId IS NULL " +
           "AND p.isActive = true " +
           "AND (p.validFrom IS NULL OR p.validFrom <= :today) " +
           "AND (p.validTo IS NULL OR p.validTo >= :today) " +
           "ORDER BY p.createdAt DESC")
    List<DeliveryPriceOverride> findCategoryPrice(UUID categoryId, UUID itemId, LocalDate today);

    List<DeliveryPriceOverride> findByItemId(UUID itemId);

    List<DeliveryPriceOverride> findByCustomerId(UUID customerId);
}
