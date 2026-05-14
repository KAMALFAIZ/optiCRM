package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.OfflineSyncLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface OfflineSyncLogRepository extends JpaRepository<OfflineSyncLog, UUID> {
    List<OfflineSyncLog> findByRepresentativeIdOrderByCreatedAtDesc(UUID repId);
    List<OfflineSyncLog> findByDeviceIdOrderByCreatedAtDesc(String deviceId);
}
