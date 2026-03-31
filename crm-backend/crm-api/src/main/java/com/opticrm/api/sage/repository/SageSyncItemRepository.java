package com.opticrm.api.sage.repository;

import com.opticrm.api.sage.entity.SageSyncItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SageSyncItemRepository extends JpaRepository<SageSyncItem, UUID> {
    List<SageSyncItem> findByRequestIdOrderByRowIndex(UUID requestId);
}
