package com.opticrm.api.agent.dto;

import java.util.UUID;

/**
 * Renvoyé une seule fois au moment de la création :
 * la clé brute n'est jamais re-affichée ensuite.
 */
public record AgentKeyCreatedDto(
        UUID keyId,
        String rawKey,
        String keyPrefix,
        String label
) {}
