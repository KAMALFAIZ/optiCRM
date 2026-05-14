package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.ReturnEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReturnEntryRepository extends JpaRepository<ReturnEntry, UUID> {
    List<ReturnEntry> findByDeliveryTourId(UUID deliveryTourId);
}
