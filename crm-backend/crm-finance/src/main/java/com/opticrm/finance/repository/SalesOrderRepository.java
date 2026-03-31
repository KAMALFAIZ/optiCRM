package com.opticrm.finance.repository;

import com.opticrm.finance.entity.SalesOrder;
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
public interface SalesOrderRepository extends JpaRepository<SalesOrder, UUID> {

    Optional<SalesOrder> findByOrderNumber(String orderNumber);

    @Query("SELECT o FROM SalesOrder o LEFT JOIN FETCH o.lines WHERE o.id = :id")
    Optional<SalesOrder> findByIdWithLines(@Param("id") UUID id);

    boolean existsByOrderNumber(String orderNumber);

    List<SalesOrder> findByAccountId(UUID accountId);

    Page<SalesOrder> findByAccountId(UUID accountId, Pageable pageable);

    Page<SalesOrder> findByAssignedToId(UUID assignedToId, Pageable pageable);

    @Query("SELECT o FROM SalesOrder o WHERE " +
            "(:accountId IS NULL OR o.account.id = :accountId) AND " +
            "(:status IS NULL OR o.status = :status) AND " +
            "(:startDate IS NULL OR o.orderDate >= :startDate) AND " +
            "(:endDate IS NULL OR o.orderDate <= :endDate)")
    Page<SalesOrder> findWithFilters(
            @Param("accountId") UUID accountId,
            @Param("status") SalesOrder.OrderStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable);

    @Query("SELECT o FROM SalesOrder o WHERE " +
            "LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(o.account.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<SalesOrder> search(@Param("search") String search, Pageable pageable);

    long countByStatus(SalesOrder.OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM SalesOrder o WHERE o.status != 'CANCELLED'")
    BigDecimal sumTotal();

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM SalesOrder o WHERE o.status = :status")
    BigDecimal sumTotalByStatus(@Param("status") SalesOrder.OrderStatus status);

    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(order_number, 5, LEN(order_number)) AS INTEGER)), 0) " +
            "FROM sales_orders WHERE order_number LIKE 'CMD-%'", nativeQuery = true)
    Integer findMaxOrderNumber();
}
