package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.AuditTrail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditTrailRepository extends JpaRepository<AuditTrail, Long> {
    List<AuditTrail> findByEntityTypeAndEntityId(String entityType, UUID entityId);
    List<AuditTrail> findByWhenDateBetween(LocalDateTime startDate, LocalDateTime endDate);
}
