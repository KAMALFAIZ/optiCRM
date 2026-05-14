package com.opticrm.communication.repository;

import com.opticrm.communication.entity.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, UUID> {
    List<PushSubscription> findByUserId(UUID userId);
    void deleteByUserIdAndEndpoint(UUID userId, String endpoint);
    boolean existsByUserIdAndEndpoint(UUID userId, String endpoint);
}
