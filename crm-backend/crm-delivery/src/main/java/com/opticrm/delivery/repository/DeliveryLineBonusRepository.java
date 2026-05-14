package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.DeliveryLineBonus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DeliveryLineBonusRepository extends JpaRepository<DeliveryLineBonus, UUID> {
    List<DeliveryLineBonus> findByDeliveryLineId(UUID deliveryLineId);
    void deleteByDeliveryLineId(UUID deliveryLineId);
}
