package com.opticrm.api.agent.repository;

import com.opticrm.api.agent.entity.SageExportQueue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SageExportQueueRepository extends JpaRepository<SageExportQueue, UUID> {

    List<SageExportQueue> findTop50ByTenantIdAndStatusInOrderByCreatedAtAsc(
            UUID tenantId, List<String> statuses);

    Page<SageExportQueue> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    Page<SageExportQueue> findByTenantIdAndStatusOrderByCreatedAtDesc(
            UUID tenantId, String status, Pageable pageable);

    boolean existsByTenantIdAndEntityTypeAndEntityIdAndStatusIn(
            UUID tenantId, String entityType, UUID entityId, List<String> statuses);
}
