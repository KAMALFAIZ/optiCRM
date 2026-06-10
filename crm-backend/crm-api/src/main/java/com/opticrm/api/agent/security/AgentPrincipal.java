package com.opticrm.api.agent.security;

import java.util.UUID;

public record AgentPrincipal(UUID keyId, UUID tenantId, String label) {
}
