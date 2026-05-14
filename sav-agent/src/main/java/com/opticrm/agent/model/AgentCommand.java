package com.opticrm.agent.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;
import java.util.Map;

/**
 * Commande reçue du serveur CRM central.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AgentCommand {

    private String commandId;
    private AgentCommandType type;
    private Map<String, Object> payload;
    private long timeoutMs;
    private Instant createdAt;
    private String tenantId;
    private String requestedBy;
    private String signature;
    private int priority;
}
