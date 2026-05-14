package com.opticrm.finance.repository;

import com.opticrm.finance.entity.Payment;
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
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByPaymentNumber(String paymentNumber);

    boolean existsByPaymentNumber(String paymentNumber);

    Page<Payment> findByAccountId(UUID accountId, Pageable pageable);

    Page<Payment> findByCreatedById(UUID createdById, Pageable pageable);

    List<Payment> findByAccountId(UUID accountId);

    @Query("SELECT p FROM Payment p WHERE p.paymentDate BETWEEN :startDate AND :endDate")
    Page<Payment> findByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE " +
            "(:accountId IS NULL OR p.account.id = :accountId) AND " +
            "(:status IS NULL OR p.status = :status) AND " +
            "(:paymentMethod IS NULL OR p.paymentMethod = :paymentMethod) AND " +
            "(:startDate IS NULL OR p.paymentDate >= :startDate) AND " +
            "(:endDate IS NULL OR p.paymentDate <= :endDate)")
    Page<Payment> findWithFilters(
            @Param("accountId") UUID accountId,
            @Param("status") Payment.PaymentStatus status,
            @Param("paymentMethod") Payment.PaymentMethod paymentMethod,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE " +
            "LOWER(p.paymentNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.reference) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.account.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Payment> search(@Param("search") String search, Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.account.id = :accountId AND p.status = 'RECEIVED'")
    BigDecimal sumByAccountId(@Param("accountId") UUID accountId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentDate BETWEEN :startDate AND :endDate AND p.status = 'RECEIVED'")
    BigDecimal sumByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.paymentDate BETWEEN :startDate AND :endDate")
    long countByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(payment_number, 5, LEN(payment_number)) AS INTEGER)), 0) " +
            "FROM payments WHERE payment_number LIKE 'PAY-%'", nativeQuery = true)
    Integer findMaxPaymentNumber();
}
