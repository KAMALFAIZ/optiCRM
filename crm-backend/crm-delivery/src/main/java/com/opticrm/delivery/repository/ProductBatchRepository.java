package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.ProductBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, UUID> {
    List<ProductBatch> findByItemId(UUID itemId);
    List<ProductBatch> findByStatus(ProductBatch.BatchStatus status);

    /** Lots qui expirent dans les N prochains jours */
    @Query("SELECT b FROM ProductBatch b WHERE b.status = 'ACTIVE' AND b.expiryDate IS NOT NULL AND b.expiryDate <= :deadline ORDER BY b.expiryDate ASC")
    List<ProductBatch> findExpiringBefore(LocalDate deadline);

    /** Lots déjà périmés et encore actifs */
    @Query("SELECT b FROM ProductBatch b WHERE b.status = 'ACTIVE' AND b.expiryDate IS NOT NULL AND b.expiryDate < :today")
    List<ProductBatch> findExpired(LocalDate today);

    List<ProductBatch> findByItemIdAndStatus(UUID itemId, ProductBatch.BatchStatus status);

    /** FEFO : lots actifs d'un article triés par date de péremption croissante */
    @Query("SELECT b FROM ProductBatch b " +
           "WHERE b.itemId = :itemId AND b.status = 'ACTIVE' AND b.quantity > 0 " +
           "AND (:warehouseId IS NULL OR b.warehouseId = :warehouseId) " +
           "ORDER BY CASE WHEN b.expiryDate IS NULL THEN 1 ELSE 0 END, b.expiryDate ASC")
    List<ProductBatch> findFefoByItem(UUID itemId, UUID warehouseId);
}
