package com.opticrm.api.agent.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AgentStatusDto(
        UUID keyId,
        String keyPrefix,
        String label,
        boolean enabled,
        LocalDateTime lastHeartbeat,
        LocalDateTime lastUsedAt,
        String lastUsedIp,
        String agentVersion,
        LocalDateTime createdAt,
        LocalDateTime revokedAt
) {}
