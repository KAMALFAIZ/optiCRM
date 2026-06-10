package com.opticrm.api.agent.repository;

import com.opticrm.api.agent.entity.AgentApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgentApiKeyRepository extends JpaRepository<AgentApiKey, UUID> {

    Optional<AgentApiKey> findByKeyHashAndEnabledTrueAndRevokedAtIsNull(String keyHash);

    List<AgentApiKey> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
}
