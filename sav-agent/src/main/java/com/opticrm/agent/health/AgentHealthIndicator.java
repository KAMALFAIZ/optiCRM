package com.opticrm.agent.health;

import com.opticrm.agent.config.AgentProperties;
import com.opticrm.agent.websocket.AgentWebSocketClient;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * Health indicator personnalisé pour l'agent.
 *
 * Accessible via : http://localhost:9091/actuator/health
 *
 * Vérifie :
 * - Connexion WebSocket au serveur central
 * - Connexion à la base locale (si activée)
 * - Réponses en attente
 */
@Component
@RequiredArgsConstructor
public class AgentHealthIndicator implements HealthIndicator {

    private final AgentWebSocketClient webSocketClient;
    private final AgentProperties properties;

    @Override
    public Health health() {
        Health.Builder builder;

        if (webSocketClient.isConnected()) {
            builder = Health.up();
        } else {
            builder = Health.down()
                    .withDetail("reason", "WebSocket disconnected")
                    .withDetail("reconnectAttempts", webSocketClient.getReconnectAttempts());
        }

        builder.withDetail("agentName", properties.getAgentName())
                .withDetail("centralUrl", properties.getCentralUrl())
                .withDetail("connected", webSocketClient.isConnected())
                .withDetail("pendingResponses", webSocketClient.getPendingResponseCount())
                .withDetail("sqlEnabled", properties.getLocalDatabase().isEnabled())
                .withDetail("httpEnabled", properties.getLocalHttp().isEnabled())
                .withDetail("shellEnabled", properties.getShell().isEnabled())
                .withDetail("strictMode", properties.getSecurity().isStrictMode());

        return builder.build();
    }
}
