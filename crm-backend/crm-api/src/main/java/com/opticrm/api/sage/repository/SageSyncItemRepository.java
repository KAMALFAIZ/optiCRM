package com.opticrm.api.sage.repository;

import com.opticrm.api.sage.entity.SageSyncItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SageSyncItemRepository extends JpaRepository<SageSyncItem, UUID> {
    List<SageSyncItem> findByRequestIdOrderByRowIndex(UUID requestId);

    @Query("SELECT i.id FROM SageSyncItem i WHERE i.request.id = :requestId ORDER BY i.rowIndex")
    List<UUID> findIdsByRequestIdOrderByRowIndex(@Param("requestId") UUID requestId);
}
