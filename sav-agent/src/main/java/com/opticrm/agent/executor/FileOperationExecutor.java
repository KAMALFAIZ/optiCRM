package com.opticrm.agent.executor;

import com.opticrm.agent.config.AgentProperties;
import com.opticrm.agent.model.AgentCommand;
import com.opticrm.agent.model.AgentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Exécute des opérations fichier locales (lecture/écriture/liste).
 *
 * Restreint aux répertoires autorisés dans la configuration.
 * Cas d'usage : export/import CSV, lecture de fichiers de config.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FileOperationExecutor implements CommandExecutor {

    private final AgentProperties properties;

    @Override
    public AgentResponse execute(AgentCommand command) {
        Map<String, Object> payload = command.getPayload();
        String operation = (String) payload.getOrDefault("operation", "read");
        String filePath = (String) payload.get("path");

        if (filePath == null || filePath.isBlank()) {
            return AgentResponse.failed(command.getCommandId(),
                    "INVALID_PATH", "Le chemin du fichier est vide");
        }

        // Vérifier que le chemin est dans un répertoire autorisé
        if (!isPathAllowed(filePath)) {
            return AgentResponse.rejected(command.getCommandId(),
                    "Chemin non autorisé: " + filePath);
        }

        Path path = Paths.get(filePath).normalize();

        return switch (operation.toLowerCase()) {
            case "read" -> readFile(command.getCommandId(), path);
            case "write" -> writeFile(command.getCommandId(), path, payload);
            case "list" -> listFiles(command.getCommandId(), path);
            case "exists" -> checkExists(command.getCommandId(), path);
            case "delete" -> deleteFile(command.getCommandId(), path);
            default -> AgentResponse.failed(command.getCommandId(),
                    "INVALID_OPERATION", "Opération inconnue: " + operation);
        };
    }

    private AgentResponse readFile(String commandId, Path path) {
        try {
            if (!Files.exists(path)) {
                return AgentResponse.failed(commandId, "FILE_NOT_FOUND", "Fichier non trouvé: " + path);
            }

            long size = Files.size(path);
            if (size > 10 * 1024 * 1024) { // 10 MB max
                return AgentResponse.failed(commandId, "FILE_TOO_LARGE",
                        "Fichier trop volumineux: " + (size / 1024 / 1024) + " MB (max 10 MB)");
            }

            String content = Files.readString(path, StandardCharsets.UTF_8);

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("path", path.toString());
            data.put("content", content);
            data.put("size", size);
            data.put("lastModified", Files.getLastModifiedTime(path).toString());

            return AgentResponse.success(commandId, data, 0);

        } catch (IOException e) {
            return AgentResponse.failed(commandId, "FILE_READ_ERROR", e.getMessage());
        }
    }

    private AgentResponse writeFile(String commandId, Path path, Map<String, Object> payload) {
        try {
            String content = (String) payload.get("content");
            if (content == null) {
                return AgentResponse.failed(commandId, "NO_CONTENT", "Aucun contenu à écrire");
            }

            boolean append = Boolean.TRUE.equals(payload.get("append"));

            // Créer les répertoires parents si nécessaire
            Files.createDirectories(path.getParent());

            if (append) {
                Files.writeString(path, content, StandardCharsets.UTF_8,
                        StandardOpenOption.CREATE, StandardOpenOption.APPEND);
            } else {
                Files.writeString(path, content, StandardCharsets.UTF_8);
            }

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("path", path.toString());
            data.put("size", Files.size(path));
            data.put("written", true);

            return AgentResponse.success(commandId, data, 0);

        } catch (IOException e) {
            return AgentResponse.failed(commandId, "FILE_WRITE_ERROR", e.getMessage());
        }
    }

    private AgentResponse listFiles(String commandId, Path path) {
        try {
            if (!Files.isDirectory(path)) {
                return AgentResponse.failed(commandId, "NOT_DIRECTORY", "Le chemin n'est pas un répertoire");
            }

            var files = Files.list(path)
                    .limit(1000)
                    .map(p -> {
                        Map<String, Object> file = new LinkedHashMap<>();
                        file.put("name", p.getFileName().toString());
                        file.put("directory", Files.isDirectory(p));
                        try {
                            file.put("size", Files.size(p));
                            file.put("lastModified", Files.getLastModifiedTime(p).toString());
                        } catch (IOException ignored) {}
                        return file;
                    })
                    .toList();

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("path", path.toString());
            data.put("files", files);
            data.put("count", files.size());

            return AgentResponse.success(commandId, data, 0);

        } catch (IOException e) {
            return AgentResponse.failed(commandId, "LIST_ERROR", e.getMessage());
        }
    }

    private AgentResponse checkExists(String commandId, Path path) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("path", path.toString());
        data.put("exists", Files.exists(path));
        data.put("directory", Files.isDirectory(path));
        data.put("readable", Files.isReadable(path));
        data.put("writable", Files.isWritable(path));

        return AgentResponse.success(commandId, data, 0);
    }

    private AgentResponse deleteFile(String commandId, Path path) {
        try {
            if (!Files.exists(path)) {
                return AgentResponse.failed(commandId, "FILE_NOT_FOUND", "Fichier non trouvé");
            }

            Files.delete(path);

            return AgentResponse.success(commandId,
                    Map.of("path", path.toString(), "deleted", true), 0);

        } catch (IOException e) {
            return AgentResponse.failed(commandId, "DELETE_ERROR", e.getMessage());
        }
    }

    /**
     * Vérifie que le chemin est dans un répertoire autorisé.
     */
    private boolean isPathAllowed(String filePath) {
        var allowed = properties.getSecurity().getAllowedFilePaths();
        if (allowed == null || allowed.isEmpty()) {
            return false;
        }

        Path normalized = Paths.get(filePath).normalize();
        return allowed.stream()
                .anyMatch(prefix -> normalized.startsWith(Paths.get(prefix).normalize()));
    }
}
