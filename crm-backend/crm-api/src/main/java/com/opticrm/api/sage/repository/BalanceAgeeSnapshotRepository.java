package com.opticrm.api.sage.repository;

import com.opticrm.api.sage.entity.BalanceAgeeSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BalanceAgeeSnapshotRepository extends JpaRepository<BalanceAgeeSnapshot, UUID> {

    List<BalanceAgeeSnapshot> findBySyncRequestId(UUID syncRequestId);

    @Query("SELECT b FROM BalanceAgeeSnapshot b WHERE b.account.id = :accountId ORDER BY b.syncedAt DESC")
    List<BalanceAgeeSnapshot> findByAccountIdOrderBySyncedAtDesc(@Param("accountId") UUID accountId);

    @Query("SELECT b FROM BalanceAgeeSnapshot b WHERE b.sageCode = :sageCode ORDER BY b.syncedAt DESC")
    List<BalanceAgeeSnapshot> findBySageCodeOrderBySyncedAtDesc(@Param("sageCode") String sageCode);
}
