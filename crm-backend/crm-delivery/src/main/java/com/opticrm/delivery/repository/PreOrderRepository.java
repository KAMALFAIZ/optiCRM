package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.PreOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface PreOrderRepository extends JpaRepository<PreOrder, UUID> {
    List<PreOrder> findByDeliveryTourId(UUID deliveryTourId);
    List<PreOrder> findByCustomerId(UUID customerId);
    List<PreOrder> findByDeliveryTourIdAndStatus(UUID deliveryTourId, PreOrder.PreOrderStatus status);

    /** Commandes en attente sans tournée affectée — à planifier */
    @org.springframework.data.jpa.repository.Query(
        "SELECT p FROM PreOrder p WHERE p.status = 'PENDING' AND p.deliveryTourId IS NULL " +
        "ORDER BY p.scheduledDate ASC NULLS LAST")
    List<PreOrder> findPendingUnscheduled();

    /** Commandes en attente pour un client avec date planifiée */
    @org.springframework.data.jpa.repository.Query(
        "SELECT p FROM PreOrder p WHERE p.customerId = :customerId " +
        "AND p.status IN ('PENDING', 'CONFIRMED') ORDER BY p.scheduledDate ASC NULLS LAST")
    List<PreOrder> findActiveByCustomer(UUID customerId);
}
