package com.opticrm.api.agent.service;

import com.opticrm.api.agent.dto.AgentKeyCreatedDto;
import com.opticrm.api.agent.dto.AgentStatusDto;
import com.opticrm.api.agent.entity.AgentApiKey;
import com.opticrm.api.agent.repository.AgentApiKeyRepository;
import com.opticrm.api.agent.security.AgentAuthenticationFilter;
import com.opticrm.tenant.context.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AgentKeyService {

    private final AgentApiKeyRepository repository;
    private static final SecureRandom RNG = new SecureRandom();
    private static final String PREFIX = "agent_sk_";

    @Transactional
    public AgentKeyCreatedDto generate(String label, UUID createdBy) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) throw new IllegalStateException("Tenant non résolu");

        byte[] random = new byte[24];
        RNG.nextBytes(random);
        String rawKey = PREFIX + HexFormat.of().formatHex(random);
        String hash = AgentAuthenticationFilter.sha256(rawKey);
        String displayPrefix = rawKey.substring(0, Math.min(rawKey.length(), 14));

        AgentApiKey k = AgentApiKey.builder()
                .tenantId(tenantId)
                .keyHash(hash)
                .keyPrefix(displayPrefix)
                .label(label)
                .enabled(true)
                .createdById(createdBy)
                .build();
        k = repository.save(k);
        return new AgentKeyCreatedDto(k.getId(), rawKey, displayPrefix, label);
    }

    @Transactional
    public void revoke(UUID keyId) {
        UUID tenantId = TenantContext.get();
        repository.findById(keyId).ifPresent(k -> {
            if (!k.getTenantId().equals(tenantId)) return;
            k.setRevokedAt(LocalDateTime.now());
            k.setEnabled(false);
            repository.save(k);
        });
    }

    public List<AgentStatusDto> list() {
        UUID tenantId = TenantContext.get();
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void recordHeartbeat(UUID keyId, String agentVersion) {
        repository.findById(keyId).ifPresent(k -> {
            k.setLastHeartbeat(LocalDateTime.now());
            if (agentVersion != null) k.setAgentVersion(agentVersion);
            repository.save(k);
        });
    }

    private AgentStatusDto toDto(AgentApiKey k) {
        return new AgentStatusDto(
                k.getId(), k.getKeyPrefix(), k.getLabel(), k.isEnabled(),
                k.getLastHeartbeat(), k.getLastUsedAt(), k.getLastUsedIp(),
                k.getAgentVersion(), k.getCreatedAt(), k.getRevokedAt());
    }
}
