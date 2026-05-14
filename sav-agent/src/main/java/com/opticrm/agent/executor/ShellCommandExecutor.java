package com.opticrm.agent.executor;

import com.opticrm.agent.config.AgentProperties;
import com.opticrm.agent.model.AgentCommand;
import com.opticrm.agent.model.AgentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Exécute des commandes shell locales.
 *
 * ATTENTION : Cette fonctionnalité est désactivée par défaut pour des raisons
 * de sécurité. Activer uniquement si nécessaire et avec une whitelist stricte.
 *
 * Cas d'usage typiques :
 * - Impression d'étiquettes (lpr, print)
 * - Scripts batch personnalisés
 * - Diagnostic réseau (ping, ipconfig)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ShellCommandExecutor implements CommandExecutor {

    private final AgentProperties properties;

    @Override
    public AgentResponse execute(AgentCommand command) {
        if (!properties.getShell().isEnabled()) {
            return AgentResponse.failed(command.getCommandId(),
                    "SHELL_DISABLED", "L'exécution de commandes shell n'est pas activée sur cet agent");
        }

        Map<String, Object> payload = command.getPayload();
        String commandLine = (String) payload.get("command");

        @SuppressWarnings("unchecked")
        List<String> args = (List<String>) payload.getOrDefault("args", List.of());

        if (commandLine == null || commandLine.isBlank()) {
            return AgentResponse.failed(command.getCommandId(),
                    "INVALID_COMMAND", "La commande est vide");
        }

        log.info("Executing shell: {} {}", commandLine, args);

        try {
            // Construire le ProcessBuilder
            ProcessBuilder pb;
            boolean isWindows = System.getProperty("os.name").toLowerCase().contains("windows");

            if (isWindows) {
                List<String> fullCmd = new java.util.ArrayList<>();
                fullCmd.add("cmd.exe");
                fullCmd.add("/c");
                fullCmd.add(commandLine);
                fullCmd.addAll(args);
                pb = new ProcessBuilder(fullCmd);
            } else {
                List<String> fullCmd = new java.util.ArrayList<>();
                fullCmd.add("/bin/sh");
                fullCmd.add("-c");
                fullCmd.add(commandLine + " " + String.join(" ", args));
                pb = new ProcessBuilder(fullCmd);
            }

            // Working directory
            String workDir = properties.getShell().getWorkingDirectory();
            if (workDir != null && !workDir.isBlank()) {
                pb.directory(new File(workDir));
            }

            pb.redirectErrorStream(false);

            // Exécuter
            Process process = pb.start();

            // Lire stdout et stderr
            StringBuilder stdout = new StringBuilder();
            StringBuilder stderr = new StringBuilder();

            try (BufferedReader outReader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                 BufferedReader errReader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {

                String line;
                while ((line = outReader.readLine()) != null) {
                    stdout.append(line).append("\n");
                }
                while ((line = errReader.readLine()) != null) {
                    stderr.append(line).append("\n");
                }
            }

            // Attendre la fin avec timeout
            boolean finished = process.waitFor(
                    properties.getShell().getTimeoutSeconds(), TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                return AgentResponse.failed(command.getCommandId(),
                        "SHELL_TIMEOUT", "Timeout après " + properties.getShell().getTimeoutSeconds() + "s");
            }

            int exitCode = process.exitValue();

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("exitCode", exitCode);
            data.put("stdout", stdout.toString().trim());
            data.put("stderr", stderr.toString().trim());

            if (exitCode == 0) {
                return AgentResponse.success(command.getCommandId(), data, 0);
            } else {
                AgentResponse response = AgentResponse.failed(command.getCommandId(),
                        "SHELL_EXIT_" + exitCode, "Exit code: " + exitCode);
                response.setData(data);
                return response;
            }

        } catch (Exception e) {
            log.error("Shell execution error: {}", e.getMessage());
            return AgentResponse.failed(command.getCommandId(),
                    "SHELL_ERROR", e.getMessage());
        }
    }
}
