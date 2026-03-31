package com.opticrm.stock.repository;

import com.opticrm.stock.entity.StockLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockLevelRepository extends JpaRepository<StockLevel, UUID> {

    @Query("SELECT s FROM StockLevel s WHERE s.product.id = :productId AND s.warehouse.id = :warehouseId")
    Optional<StockLevel> findByProductIdAndWarehouseId(
            @Param("productId") UUID productId,
            @Param("warehouseId") UUID warehouseId);

    @Query("SELECT s FROM StockLevel s JOIN FETCH s.warehouse WHERE s.product.id = :productId")
    List<StockLevel> findByProductId(@Param("productId") UUID productId);

    @Query("SELECT s FROM StockLevel s JOIN FETCH s.product WHERE s.warehouse.id = :warehouseId")
    Page<StockLevel> findByWarehouseId(@Param("warehouseId") UUID warehouseId, Pageable pageable);

    @Query("SELECT s FROM StockLevel s JOIN FETCH s.product p JOIN FETCH s.warehouse " +
            "WHERE (s.quantityOnHand - s.quantityReserved) <= p.minStockLevel AND p.minStockLevel > 0")
    List<StockLevel> findLowStock();

    @Query("SELECT s FROM StockLevel s JOIN FETCH s.product p JOIN FETCH s.warehouse " +
            "WHERE (s.quantityOnHand - s.quantityReserved) <= p.reorderLevel AND p.reorderLevel > 0")
    List<StockLevel> findNeedingReorder();

    @Query("SELECT s FROM StockLevel s JOIN FETCH s.product JOIN FETCH s.warehouse")
    Page<StockLevel> findAllWithDetails(Pageable pageable);

    @Query("SELECT SUM(s.quantityOnHand) FROM StockLevel s WHERE s.product.id = :productId")
    java.math.BigDecimal getTotalQuantityOnHand(@Param("productId") UUID productId);

    @Query("SELECT SUM(s.quantityOnHand * s.averageCost) FROM StockLevel s WHERE s.warehouse.id = :warehouseId")
    java.math.BigDecimal getTotalValueByWarehouse(@Param("warehouseId") UUID warehouseId);

    @Query("SELECT COUNT(s) FROM StockLevel s WHERE s.warehouse.id = :warehouseId AND s.quantityOnHand > 0")
    long countProductsInWarehouse(@Param("warehouseId") UUID warehouseId);
}
