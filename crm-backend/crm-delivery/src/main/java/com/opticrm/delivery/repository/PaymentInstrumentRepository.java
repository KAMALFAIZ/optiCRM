package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.PaymentInstrument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentInstrumentRepository extends JpaRepository<PaymentInstrument, UUID> {

    List<PaymentInstrument> findByDeliveryLineId(UUID deliveryLineId);

    List<PaymentInstrument> findByStatus(PaymentInstrument.InstrumentStatus status);

    @Query("SELECT p FROM PaymentInstrument p WHERE p.status = 'PENDING' AND p.dueDate <= :date")
    List<PaymentInstrument> findOverduePending(@Param("date") LocalDate date);

    @Query("SELECT p FROM PaymentInstrument p " +
           "WHERE p.deliveryLineId IN " +
           "  (SELECT l.id FROM DeliveryLine l WHERE l.deliveryTour.id = :tourId) " +
           "ORDER BY p.dueDate ASC NULLS LAST")
    List<PaymentInstrument> findByTourId(@Param("tourId") UUID tourId);
}
