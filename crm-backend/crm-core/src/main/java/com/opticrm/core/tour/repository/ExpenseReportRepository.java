package com.opticrm.core.tour.repository;

import com.opticrm.core.tour.entity.ExpenseReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface ExpenseReportRepository extends JpaRepository<ExpenseReport, UUID> {

    List<ExpenseReport> findByTourId(UUID tourId);

    Page<ExpenseReport> findByTourId(UUID tourId, Pageable pageable);

    Page<ExpenseReport> findByStatus(ExpenseReport.ExpenseReportStatus status, Pageable pageable);

    @Query("SELECT e FROM ExpenseReport e WHERE " +
           "LOWER(e.reportNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.tour.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<ExpenseReport> search(@Param("search") String search, Pageable pageable);

    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(report_number, 5, LEN(report_number)) AS INTEGER)), 0) " +
                   "FROM expense_reports WHERE report_number LIKE 'NDF-%'", nativeQuery = true)
    Integer findMaxReportNumber();

    Page<ExpenseReport> findBySubmittedById(UUID userId, Pageable pageable);

    long countByTourId(UUID tourId);

    @Query(value = "SELECT COALESCE(SUM(total_amount), 0) FROM expense_reports " +
                   "WHERE tour_id = :tourId AND status <> 'REJECTED'", nativeQuery = true)
    BigDecimal sumTotalByTourId(@Param("tourId") UUID tourId);
}
