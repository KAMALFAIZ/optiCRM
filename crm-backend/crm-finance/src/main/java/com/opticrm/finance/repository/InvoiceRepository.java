package com.opticrm.finance.repository;

import com.opticrm.finance.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    boolean existsByInvoiceNumber(String invoiceNumber);

    List<Invoice> findByAccountId(UUID accountId);

    Page<Invoice> findByCreatedById(UUID createdById, Pageable pageable);

    Page<Invoice> findByAccountId(UUID accountId, Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE " +
            "(:accountId IS NULL OR i.account.id = :accountId) AND " +
            "(:status IS NULL OR i.status = :status) AND " +
            "(:startDate IS NULL OR i.invoiceDate >= :startDate) AND " +
            "(:endDate IS NULL OR i.invoiceDate <= :endDate)")
    Page<Invoice> findWithFilters(
            @Param("accountId") UUID accountId,
            @Param("status") Invoice.InvoiceStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE " +
            "LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(i.account.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(i.billingName) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Invoice> search(@Param("search") String search, Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE i.status NOT IN ('PAID', 'CANCELLED') AND i.dueDate < :today")
    List<Invoice> findOverdue(@Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.status != 'CANCELLED'")
    BigDecimal sumTotal();

    @Query("SELECT COALESCE(SUM(i.amountPaid), 0) FROM Invoice i WHERE i.status != 'CANCELLED'")
    BigDecimal sumPaid();

    @Query("SELECT COALESCE(SUM(i.total - i.amountPaid), 0) FROM Invoice i WHERE i.status NOT IN ('PAID', 'CANCELLED')")
    BigDecimal sumDue();

    @Query("SELECT COALESCE(SUM(i.total - i.amountPaid), 0) FROM Invoice i WHERE i.status NOT IN ('PAID', 'CANCELLED') AND i.dueDate < :today")
    BigDecimal sumOverdue(@Param("today") LocalDate today);

    long countByStatus(Invoice.InvoiceStatus status);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.status NOT IN ('PAID', 'CANCELLED') AND i.dueDate < :today")
    long countOverdue(@Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.account.id = :accountId AND i.status != 'CANCELLED'")
    BigDecimal sumTotalByAccountId(@Param("accountId") UUID accountId);

    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number, 5, LEN(invoice_number)) AS INTEGER)), 0) " +
            "FROM invoices WHERE invoice_number LIKE 'FAC-%'", nativeQuery = true)
    Integer findMaxInvoiceNumber();

    // Account-specific stats
    @Query("SELECT COALESCE(SUM(i.amountPaid), 0) FROM Invoice i WHERE i.account.id = :accountId AND i.status != 'CANCELLED'")
    BigDecimal sumPaidByAccountId(@Param("accountId") UUID accountId);

    @Query("SELECT COALESCE(SUM(i.total - i.amountPaid), 0) FROM Invoice i WHERE i.account.id = :accountId AND i.status NOT IN ('PAID', 'CANCELLED')")
    BigDecimal sumDueByAccountId(@Param("accountId") UUID accountId);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.account.id = :accountId AND i.status NOT IN ('PAID', 'CANCELLED') AND i.dueDate < :today")
    long countOverdueByAccountId(@Param("accountId") UUID accountId, @Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(i.total - i.amountPaid), 0) FROM Invoice i WHERE i.account.id = :accountId AND i.status NOT IN ('PAID', 'CANCELLED') AND i.dueDate < :today")
    BigDecimal sumOverdueByAccountId(@Param("accountId") UUID accountId, @Param("today") LocalDate today);

    @Query(value = "SELECT COALESCE(SUM(i.total), 0) FROM invoices i WHERE i.account_id = :accountId AND i.status != 'CANCELLED' AND YEAR(i.invoice_date) = :year", nativeQuery = true)
    BigDecimal sumTotalByAccountIdAndYear(@Param("accountId") UUID accountId, @Param("year") int year);

    // ── Balance Âgée ─────────────────────────────────────────────────────────
    @Query(value = """
            SELECT
              CAST(a.id AS varchar)                             AS account_id,
              a.name                                            AS account_name,
              CAST(u.id AS varchar)                             AS commercial_id,
              CONCAT(u.first_name, ' ', u.last_name)           AS commercial_name,
              COALESCE(SUM(CASE
                WHEN i.due_date >= CAST(GETDATE() AS DATE)
                THEN i.amount_due ELSE 0 END), 0)              AS non_echu,
              COALESCE(SUM(CASE
                WHEN i.due_date < CAST(GETDATE() AS DATE)
                 AND i.due_date >= DATEADD(day, -30, CAST(GETDATE() AS DATE))
                THEN i.amount_due ELSE 0 END), 0)              AS echu_1_30,
              COALESCE(SUM(CASE
                WHEN i.due_date < DATEADD(day, -30, CAST(GETDATE() AS DATE))
                 AND i.due_date >= DATEADD(day, -60, CAST(GETDATE() AS DATE))
                THEN i.amount_due ELSE 0 END), 0)              AS echu_31_60,
              COALESCE(SUM(CASE
                WHEN i.due_date < DATEADD(day, -60, CAST(GETDATE() AS DATE))
                 AND i.due_date >= DATEADD(day, -90, CAST(GETDATE() AS DATE))
                THEN i.amount_due ELSE 0 END), 0)              AS echu_61_90,
              COALESCE(SUM(CASE
                WHEN i.due_date < DATEADD(day, -90, CAST(GETDATE() AS DATE))
                THEN i.amount_due ELSE 0 END), 0)              AS echu_91_plus,
              COALESCE(SUM(i.amount_due), 0)                   AS total_due,
              COUNT(i.id)                                       AS invoice_count
            FROM invoices i
            JOIN accounts a ON i.account_id = a.id
            LEFT JOIN users u ON a.assigned_to_id = u.id
            WHERE i.status NOT IN ('PAID', 'CANCELLED', 'DRAFT')
              AND i.amount_due > 0
              AND (:commercialId = 'ALL' OR CAST(a.assigned_to_id AS varchar) = :commercialId)
            GROUP BY a.id, a.name, u.id, u.first_name, u.last_name
            ORDER BY total_due DESC
            """, nativeQuery = true)
    List<Object[]> findAgedBalance(@Param("commercialId") String commercialId);
}
