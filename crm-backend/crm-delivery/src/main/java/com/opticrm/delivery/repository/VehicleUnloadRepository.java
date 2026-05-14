package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.VehicleUnload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleUnloadRepository extends JpaRepository<VehicleUnload, UUID> {
    Optional<VehicleUnload> findByDeliveryTourId(UUID deliveryTourId);
    boolean existsByDeliveryTourId(UUID deliveryTourId);
}
