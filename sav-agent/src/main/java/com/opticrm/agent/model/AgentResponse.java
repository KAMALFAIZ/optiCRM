package com.opticrm.agent.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;
import java.util.Map;

/**
 * Réponse envoyée au serveur CRM central après exécution d'une commande.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AgentResponse {

    /** ID de la commande (corrélation) */
    private String commandId;

    /** Type de message pour le protocole */
    @Builder.Default
    private String type = "RESPONSE";

    /** Statut d'exécution */
    private CommandStatus status;

    /** Données retournées */
    private Map<String, Object> data;

    /** Message d'erreur */
    private String errorMessage;

    /** Code d'erreur */
    private String errorCode;

    /** Horodatage de la réponse */
    @Builder.Default
    private Instant respondedAt = Instant.now();

    /** Durée d'exécution locale en ms */
    private long executionTimeMs;

    /** ID de l'agent */
    private String agentId;

    // ───── Factory methods ─────

    public static AgentResponse success(String commandId, Map<String, Object> data, long executionTimeMs) {
        return AgentResponse.builder()
                .commandId(commandId)
                .status(CommandStatus.SUCCESS)
                .data(data)
                .executionTimeMs(executionTimeMs)
                .build();
    }

    public static AgentResponse failed(String commandId, String errorCode, String errorMessage) {
        return AgentResponse.builder()
                .commandId(commandId)
                .status(CommandStatus.FAILED)
                .errorCode(errorCode)
                .errorMessage(errorMessage)
                .build();
    }

    public static AgentResponse rejected(String commandId, String reason) {
        return AgentResponse.builder()
                .commandId(commandId)
                .status(CommandStatus.REJECTED)
                .errorCode("REJECTED")
                .errorMessage(reason)
                .build();
    }
}
