package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.SettlementReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementReportRepository extends JpaRepository<SettlementReport, UUID> {
    Optional<SettlementReport> findByDeliveryTourId(UUID deliveryTourId);
}
