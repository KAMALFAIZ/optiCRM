package com.opticrm.stock.repository;

import com.opticrm.stock.entity.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

    @Query("SELECT m FROM StockMovement m JOIN FETCH m.product JOIN FETCH m.warehouse WHERE m.product.id = :productId ORDER BY m.createdAt DESC")
    Page<StockMovement> findByProductId(@Param("productId") UUID productId, Pageable pageable);

    @Query("SELECT m FROM StockMovement m JOIN FETCH m.product JOIN FETCH m.warehouse WHERE m.warehouse.id = :warehouseId ORDER BY m.createdAt DESC")
    Page<StockMovement> findByWarehouseId(@Param("warehouseId") UUID warehouseId, Pageable pageable);

    @Query("SELECT m FROM StockMovement m JOIN FETCH m.product JOIN FETCH m.warehouse " +
            "WHERE m.product.id = :productId AND m.warehouse.id = :warehouseId ORDER BY m.createdAt DESC")
    Page<StockMovement> findByProductIdAndWarehouseId(
            @Param("productId") UUID productId,
            @Param("warehouseId") UUID warehouseId,
            Pageable pageable);

    @Query("SELECT m FROM StockMovement m JOIN FETCH m.product JOIN FETCH m.warehouse " +
            "WHERE m.createdAt BETWEEN :startDate AND :endDate ORDER BY m.createdAt DESC")
    Page<StockMovement> findByDateRange(
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            Pageable pageable);

    Page<StockMovement> findByMovementType(String movementType, Pageable pageable);

    @Query("SELECT m FROM StockMovement m JOIN FETCH m.product JOIN FETCH m.warehouse " +
            "WHERE m.referenceType = :referenceType AND m.referenceId = :referenceId")
    List<StockMovement> findByReference(
            @Param("referenceType") String referenceType,
            @Param("referenceId") UUID referenceId);

    @Query("SELECT m FROM StockMovement m JOIN FETCH m.product JOIN FETCH m.warehouse ORDER BY m.createdAt DESC")
    Page<StockMovement> findAllWithDetails(Pageable pageable);

    @Query("SELECT m.movementType, COUNT(m), SUM(m.quantity) FROM StockMovement m " +
            "WHERE m.createdAt BETWEEN :startDate AND :endDate GROUP BY m.movementType")
    List<Object[]> getMovementStatsByType(
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);

    @Query("SELECT SUM(m.quantity) FROM StockMovement m " +
            "WHERE m.product.id = :productId AND m.warehouse.id = :warehouseId")
    java.math.BigDecimal calculateStockBalance(
            @Param("productId") UUID productId,
            @Param("warehouseId") UUID warehouseId);
}
