package com.opticrm.agent.executor;

import com.opticrm.agent.model.AgentCommand;
import com.opticrm.agent.model.AgentResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.lang.management.ManagementFactory;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Répond au ping du serveur central avec les métriques de santé de l'agent.
 */
@Slf4j
@Component
public class PingExecutor implements CommandExecutor {

    @Override
    public AgentResponse execute(AgentCommand command) {
        Map<String, Object> payload = command.getPayload();
        Number sentAt = payload != null ? (Number) payload.get("sentAt") : null;

        long latencyMs = sentAt != null
                ? System.currentTimeMillis() - sentAt.longValue()
                : 0;

        Runtime runtime = Runtime.getRuntime();
        long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("latencyMs", latencyMs);
        data.put("uptime", formatUptime(uptimeMs));
        data.put("uptimeMs", uptimeMs);
        data.put("freeMemoryMb", runtime.freeMemory() / (1024 * 1024));
        data.put("totalMemoryMb", runtime.totalMemory() / (1024 * 1024));
        data.put("maxMemoryMb", runtime.maxMemory() / (1024 * 1024));
        data.put("availableProcessors", runtime.availableProcessors());
        data.put("timestamp", System.currentTimeMillis());

        return AgentResponse.success(command.getCommandId(), data, 0);
    }

    private String formatUptime(long ms) {
        Duration d = Duration.ofMillis(ms);
        long days = d.toDays();
        long hours = d.toHours() % 24;
        long minutes = d.toMinutes() % 60;

        if (days > 0) {
            return String.format("%dj %dh %dm", days, hours, minutes);
        } else if (hours > 0) {
            return String.format("%dh %dm", hours, minutes);
        } else {
            return String.format("%dm", minutes);
        }
    }
}
