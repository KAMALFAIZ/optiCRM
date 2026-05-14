package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.VehicleLoadItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface VehicleLoadItemRepository extends JpaRepository<VehicleLoadItem, UUID> {

    List<VehicleLoadItem> findByVehicleLoadId(UUID vehicleLoadId);

    @Query("SELECT i FROM VehicleLoadItem i JOIN i.vehicleLoad v " +
           "WHERE v.deliveryTour.id = :tourId AND i.itemId = :itemId")
    List<VehicleLoadItem> findByTourAndItem(
            @Param("tourId") UUID tourId,
            @Param("itemId") UUID itemId);
}
