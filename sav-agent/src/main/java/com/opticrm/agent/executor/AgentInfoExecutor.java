package com.opticrm.agent.executor;

import com.opticrm.agent.config.AgentProperties;
import com.opticrm.agent.model.AgentCommand;
import com.opticrm.agent.model.AgentCommandType;
import com.opticrm.agent.model.AgentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Retourne les métadonnées complètes de l'agent
 * (version, OS, hostname, capacités, configuration).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AgentInfoExecutor implements CommandExecutor {

    private final AgentProperties properties;

    @Override
    public AgentResponse execute(AgentCommand command) {
        Map<String, Object> data = new LinkedHashMap<>();

        // Informations système
        data.put("version", "1.0.0");
        data.put("agentName", properties.getAgentName());
        data.put("os", System.getProperty("os.name") + " " + System.getProperty("os.version"));
        data.put("osArch", System.getProperty("os.arch"));
        data.put("javaVersion", System.getProperty("java.version"));
        data.put("javaVendor", System.getProperty("java.vendor"));

        try {
            data.put("hostname", InetAddress.getLocalHost().getHostName());
            data.put("ipAddress", InetAddress.getLocalHost().getHostAddress());
        } catch (Exception e) {
            data.put("hostname", "unknown");
        }

        // Capacités
        Map<String, Boolean> capabilities = new LinkedHashMap<>();
        capabilities.put("sql", properties.getLocalDatabase().isEnabled());
        capabilities.put("http", properties.getLocalHttp().isEnabled());
        capabilities.put("shell", properties.getShell().isEnabled());
        capabilities.put("file", !properties.getSecurity().getAllowedFilePaths().isEmpty());
        data.put("capabilities", capabilities);

        // Types de commandes supportées
        data.put("supportedCommands",
                Arrays.stream(AgentCommandType.values()).map(Enum::name).toList());

        // Configuration (sans les secrets)
        Map<String, Object> config = new LinkedHashMap<>();
        config.put("strictMode", properties.getSecurity().isStrictMode());
        config.put("heartbeatIntervalSeconds", properties.getHeartbeatIntervalSeconds());
        if (properties.getLocalDatabase().isEnabled()) {
            config.put("localDbUrl", maskUrl(properties.getLocalDatabase().getUrl()));
            config.put("queryTimeoutSeconds", properties.getLocalDatabase().getQueryTimeoutSeconds());
            config.put("maxRows", properties.getLocalDatabase().getMaxRows());
        }
        if (properties.getLocalHttp().isEnabled()) {
            config.put("httpBaseUrl", properties.getLocalHttp().getBaseUrl());
        }
        data.put("config", config);

        // Ressources système
        Runtime runtime = Runtime.getRuntime();
        data.put("freeMemoryMb", runtime.freeMemory() / (1024 * 1024));
        data.put("totalMemoryMb", runtime.totalMemory() / (1024 * 1024));
        data.put("availableProcessors", runtime.availableProcessors());

        return AgentResponse.success(command.getCommandId(), data, 0);
    }

    /**
     * Masque les informations sensibles dans une URL JDBC.
     */
    private String maskUrl(String url) {
        if (url == null) return null;
        // Masquer le password si dans l'URL
        return url.replaceAll("password=[^;&]+", "password=***");
    }
}
