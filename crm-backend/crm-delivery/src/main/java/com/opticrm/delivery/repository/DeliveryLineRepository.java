package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.DeliveryLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DeliveryLineRepository extends JpaRepository<DeliveryLine, UUID> {

    List<DeliveryLine> findByDeliveryTourId(UUID deliveryTourId);

    @Query("SELECT COALESCE(SUM(l.quantity), 0) FROM DeliveryLine l " +
           "WHERE l.deliveryTour.id = :tourId AND l.itemId = :itemId")
    Integer sumDeliveredQtyByTourAndItem(@Param("tourId") UUID tourId,
                                         @Param("itemId") UUID itemId);

    @Query("SELECT COALESCE(SUM(l.quantity), 0) FROM DeliveryLine l " +
           "WHERE l.deliveryTour.id = :tourId AND l.itemId = :itemId AND l.id <> :excludeId")
    Integer sumDeliveredQtyByTourAndItemExcluding(@Param("tourId") UUID tourId,
                                                   @Param("itemId") UUID itemId,
                                                   @Param("excludeId") UUID excludeId);

    // ── Crédit encours ────────────────────────────────────────────────────────

    @Query("SELECT COALESCE(SUM(l.amount - COALESCE(l.paidAmount,0)), 0) FROM DeliveryLine l " +
           "WHERE l.customerId = :customerId " +
           "AND l.paymentMode = 'CREDIT' " +
           "AND l.deliveryTour.status <> 'CLOSED'")
    java.math.BigDecimal sumOutstandingCreditByCustomer(@Param("customerId") UUID customerId);

    @Query("SELECT COALESCE(SUM(l.amount - COALESCE(l.paidAmount,0)), 0) FROM DeliveryLine l " +
           "WHERE l.customerId = :customerId " +
           "AND l.paymentMode = 'CREDIT' " +
           "AND l.deliveryTour.status <> 'CLOSED' " +
           "AND l.deliveryTour.id <> :excludeTourId")
    java.math.BigDecimal sumOutstandingCreditByCustomerExcludingTour(
            @Param("customerId") UUID customerId,
            @Param("excludeTourId") UUID excludeTourId);

    /**
     * Stock consommé = quantityDelivered pour PARTIAL, quantity pour DELIVERED (fallback si null).
     * ABSENT/REFUSED/CLOSED ne consomment aucun stock.
     */
    @Query("SELECT COALESCE(SUM(" +
           "  CASE l.visitResult " +
           "    WHEN 'DELIVERED' THEN COALESCE(l.quantityDelivered, l.quantity) " +
           "    WHEN 'PARTIAL'   THEN COALESCE(l.quantityDelivered, 0) " +
           "    ELSE 0 " +
           "  END), 0) " +
           "FROM DeliveryLine l " +
           "WHERE l.deliveryTour.id = :tourId AND l.itemId = :itemId")
    Integer sumDeliveredOnlyQtyByTourAndItem(@Param("tourId") UUID tourId,
                                              @Param("itemId") UUID itemId);

    // ── Reporting ─────────────────────────────────────────────────────────────

    @Query("SELECT COALESCE(SUM(l.amount), 0) FROM DeliveryLine l " +
           "WHERE l.deliveryTour.tourDate BETWEEN :from AND :to " +
           "AND l.visitResult IN ('DELIVERED', 'PARTIAL')")
    java.math.BigDecimal sumRevenueByPeriod(@Param("from") LocalDate from,
                                             @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(l.paidAmount), 0) FROM DeliveryLine l " +
           "WHERE l.deliveryTour.tourDate BETWEEN :from AND :to " +
           "AND l.visitResult IN ('DELIVERED', 'PARTIAL')")
    java.math.BigDecimal sumCollectedByPeriod(@Param("from") LocalDate from,
                                               @Param("to") LocalDate to);

    @Query("SELECT l.deliveryTour.representativeId, COALESCE(SUM(l.amount), 0) " +
           "FROM DeliveryLine l " +
           "WHERE l.deliveryTour.tourDate BETWEEN :from AND :to " +
           "AND l.visitResult IN ('DELIVERED', 'PARTIAL') " +
           "GROUP BY l.deliveryTour.representativeId " +
           "ORDER BY SUM(l.amount) DESC")
    List<Object[]> sumRevenueByRepresentative(@Param("from") LocalDate from,
                                               @Param("to") LocalDate to);

    @Query("SELECT l.itemId, COALESCE(SUM(l.quantity), 0), COALESCE(SUM(l.amount), 0) " +
           "FROM DeliveryLine l " +
           "WHERE l.deliveryTour.tourDate BETWEEN :from AND :to " +
           "AND l.visitResult IN ('DELIVERED', 'PARTIAL') " +
           "GROUP BY l.itemId " +
           "ORDER BY SUM(l.amount) DESC")
    List<Object[]> sumRevenueByItem(@Param("from") LocalDate from,
                                     @Param("to") LocalDate to);

    @Query("SELECT l.deliveryTour.tourDate, COALESCE(SUM(l.amount), 0) " +
           "FROM DeliveryLine l " +
           "WHERE l.deliveryTour.tourDate BETWEEN :from AND :to " +
           "AND l.visitResult IN ('DELIVERED', 'PARTIAL') " +
           "GROUP BY l.deliveryTour.tourDate " +
           "ORDER BY l.deliveryTour.tourDate")
    List<Object[]> sumRevenueByDay(@Param("from") LocalDate from,
                                    @Param("to") LocalDate to);

    @Query("SELECT l FROM DeliveryLine l " +
           "WHERE l.paymentMode = 'CREDIT' " +
           "AND (l.amount - COALESCE(l.paidAmount, 0)) > 0 " +
           "AND l.deliveryTour.status <> 'CLOSED' " +
           "ORDER BY l.deliveryTour.tourDate ASC")
    List<DeliveryLine> findAllOutstandingCreditLines();

    @Query("SELECT l FROM DeliveryLine l " +
           "WHERE l.paymentMode = 'CREDIT' " +
           "AND (l.amount - COALESCE(l.paidAmount, 0)) > 0 " +
           "ORDER BY l.deliveryTour.tourDate ASC")
    List<DeliveryLine> findAllPendingCreditLines();

    @Query("SELECT l.visitResult, COUNT(l) FROM DeliveryLine l " +
           "WHERE l.deliveryTour.tourDate BETWEEN :from AND :to " +
           "GROUP BY l.visitResult")
    List<Object[]> countVisitResultsByPeriod(@Param("from") LocalDate from,
                                              @Param("to") LocalDate to);

    // ── Contrôle crédit ───────────────────────────────────────────────────────

    @Query("SELECT COUNT(l) > 0 FROM DeliveryLine l " +
           "WHERE l.customerId = :customerId " +
           "AND l.paymentMode = 'CREDIT' " +
           "AND (l.amount - COALESCE(l.paidAmount, 0)) > 0 " +
           "AND l.deliveryTour.tourDate <= :cutoffDate")
    boolean hasOverdueCredit(@Param("customerId") UUID customerId,
                              @Param("cutoffDate") LocalDate cutoffDate);

    @Query("SELECT MIN(l.deliveryTour.tourDate) FROM DeliveryLine l " +
           "WHERE l.customerId = :customerId " +
           "AND l.paymentMode = 'CREDIT' " +
           "AND (l.amount - COALESCE(l.paidAmount, 0)) > 0")
    LocalDate oldestOutstandingCreditDate(@Param("customerId") UUID customerId);

    // ── Rapports gestionnaire ─────────────────────────────────────────────────

    @Query("SELECT l.customerId, COALESCE(SUM(l.amount), 0), COALESCE(SUM(l.paidAmount), 0), COUNT(l) " +
           "FROM DeliveryLine l " +
           "WHERE l.deliveryTour.tourDate BETWEEN :from AND :to " +
           "AND (:repId IS NULL OR l.deliveryTour.representativeId = :repId) " +
           "AND l.visitResult IN ('DELIVERED', 'PARTIAL') " +
           "GROUP BY l.customerId " +
           "ORDER BY SUM(l.amount) DESC")
    List<Object[]> sumRevenueByCustomer(@Param("from") LocalDate from,
                                         @Param("to") LocalDate to,
                                         @Param("repId") UUID repId);

    @Query("SELECT l.deliveryTour.representativeId, " +
           "       COALESCE(SUM(l.amount), 0), COALESCE(SUM(l.paidAmount), 0), COUNT(l) " +
           "FROM DeliveryLine l " +
           "WHERE l.deliveryTour.tourDate BETWEEN :from AND :to " +
           "AND l.visitResult IN ('DELIVERED', 'PARTIAL') " +
           "GROUP BY l.deliveryTour.representativeId")
    List<Object[]> sumRevenueAndCollectedByRep(@Param("from") LocalDate from,
                                                @Param("to") LocalDate to);

    @Query("SELECT COUNT(l) FROM DeliveryLine l " +
           "WHERE l.deliveryTour.id = :tourId " +
           "AND l.visitResult IN ('DELIVERED', 'PARTIAL')")
    long countDeliveredByTour(@Param("tourId") UUID tourId);
}
