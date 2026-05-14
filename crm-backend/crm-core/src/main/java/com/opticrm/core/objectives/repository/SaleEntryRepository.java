package com.opticrm.core.objectives.repository;

import com.opticrm.core.objectives.entity.SaleEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface SaleEntryRepository extends JpaRepository<SaleEntry, UUID> {

    @Query(value = "SELECT * FROM sale_entries WHERE " +
           "YEAR(sale_date) = :year " +
           "AND (:month IS NULL OR MONTH(sale_date) = :month) " +
           "AND (:userId IS NULL OR user_id = :userId) " +
           "AND (:productId IS NULL OR product_id = :productId) " +
           "ORDER BY sale_date DESC",
           nativeQuery = true)
    List<SaleEntry> findFiltered(
            @Param("year") int year,
            @Param("month") Integer month,
            @Param("userId") UUID userId,
            @Param("productId") UUID productId);

    @Query("SELECT s FROM SaleEntry s WHERE s.userId = :userId " +
           "AND s.saleDate BETWEEN :from AND :to ORDER BY s.saleDate DESC")
    List<SaleEntry> findByUserIdAndPeriod(
            @Param("userId") UUID userId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
