package com.opticrm.agent.security;

import com.opticrm.agent.config.AgentProperties;
import com.opticrm.agent.model.AgentCommand;
import com.opticrm.agent.model.AgentCommandType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Filtre de sécurité pour les commandes reçues.
 *
 * Vérifie chaque commande contre les whitelist configurées :
 * - SQL : patterns regex autorisés
 * - HTTP : préfixes d'URL autorisés
 * - Shell : commandes exactes autorisées
 * - File : répertoires autorisés
 *
 * En mode strict (par défaut), toute commande non whitelistée est rejetée.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CommandSecurityFilter {

    private final AgentProperties properties;

    /** Cache des patterns SQL compilés */
    private List<Pattern> compiledSqlPatterns;

    /**
     * Valide une commande.
     *
     * @return null si autorisée, ou le message de rejet
     */
    public String validate(AgentCommand command) {
        AgentCommandType type = command.getType();

        // PING et AGENT_INFO sont toujours autorisés
        if (type == AgentCommandType.PING || type == AgentCommandType.AGENT_INFO) {
            return null;
        }

        if (!properties.getSecurity().isStrictMode()) {
            return null; // Mode permissif : tout passe
        }

        return switch (type) {
            case SQL_QUERY, SQL_EXECUTE -> validateSql(command);
            case HTTP_REQUEST -> validateHttp(command);
            case SHELL_COMMAND -> validateShell(command);
            case FILE_OPERATION -> validateFile(command);
            default -> null;
        };
    }

    // ───── Validators ─────

    private String validateSql(AgentCommand command) {
        if (!properties.getLocalDatabase().isEnabled()) {
            return "L'exécution SQL n'est pas activée";
        }

        Map<String, Object> payload = command.getPayload();
        String query = (String) payload.get("query");

        if (query == null || query.isBlank()) {
            return "Requête SQL vide";
        }

        // Vérifier contre les patterns autorisés
        List<String> patterns = properties.getSecurity().getAllowedSqlPatterns();
        if (patterns == null || patterns.isEmpty()) {
            return "Aucun pattern SQL autorisé configuré";
        }

        if (compiledSqlPatterns == null) {
            compiledSqlPatterns = patterns.stream()
                    .map(p -> Pattern.compile(p, Pattern.CASE_INSENSITIVE | Pattern.DOTALL))
                    .collect(Collectors.toList());
        }

        String normalizedQuery = query.trim().replaceAll("\\s+", " ");

        boolean allowed = compiledSqlPatterns.stream()
                .anyMatch(p -> p.matcher(normalizedQuery).matches());

        if (!allowed) {
            log.warn("SQL query REJECTED (no matching pattern): {}", truncate(query, 100));
            return "Requête SQL non autorisée: " + truncate(normalizedQuery, 100);
        }

        // Vérifier les injections dangereuses
        String upper = normalizedQuery.toUpperCase();
        if (command.getType() == AgentCommandType.SQL_QUERY) {
            // En mode QUERY, bloquer les modifications
            if (upper.contains("DROP ") || upper.contains("DELETE ")
                    || upper.contains("TRUNCATE ") || upper.contains("ALTER ")
                    || upper.contains("CREATE ") || upper.contains("EXEC ")
                    || upper.contains("EXECUTE ") || upper.contains("XP_")) {
                return "Requête de modification interdite en mode SQL_QUERY";
            }
        }

        return null; // OK
    }

    private String validateHttp(AgentCommand command) {
        if (!properties.getLocalHttp().isEnabled()) {
            return "Les appels HTTP ne sont pas activés";
        }

        Map<String, Object> payload = command.getPayload();
        String url = (String) payload.get("url");

        if (url == null || url.isBlank()) {
            return "URL vide";
        }

        List<String> prefixes = properties.getSecurity().getAllowedHttpPrefixes();
        if (prefixes == null || prefixes.isEmpty()) {
            return "Aucun préfixe HTTP autorisé configuré";
        }

        // Si l'URL est relative, préfixer avec baseUrl
        String fullUrl = url.startsWith("http")
                ? url
                : properties.getLocalHttp().getBaseUrl() + url;

        boolean allowed = prefixes.stream()
                .anyMatch(fullUrl::startsWith);

        if (!allowed) {
            log.warn("HTTP URL REJECTED: {}", url);
            return "URL non autorisée: " + url;
        }

        return null;
    }

    private String validateShell(AgentCommand command) {
        if (!properties.getShell().isEnabled()) {
            return "L'exécution shell n'est pas activée";
        }

        Map<String, Object> payload = command.getPayload();
        String cmd = (String) payload.get("command");

        if (cmd == null || cmd.isBlank()) {
            return "Commande vide";
        }

        List<String> allowed = properties.getSecurity().getAllowedShellCommands();
        if (allowed == null || allowed.isEmpty()) {
            return "Aucune commande shell autorisée configurée";
        }

        // Extraire le nom de la commande (premier mot)
        String commandName = cmd.trim().split("\\s+")[0].toLowerCase();

        boolean isAllowed = allowed.stream()
                .map(String::toLowerCase)
                .anyMatch(a -> a.equals(commandName));

        if (!isAllowed) {
            log.warn("Shell command REJECTED: {}", cmd);
            return "Commande shell non autorisée: " + commandName;
        }

        // Bloquer les opérateurs dangereux
        if (cmd.contains("|") || cmd.contains(">") || cmd.contains("<")
                || cmd.contains("&&") || cmd.contains("||") || cmd.contains(";")
                || cmd.contains("`") || cmd.contains("$(")) {
            return "Opérateurs shell dangereux détectés";
        }

        return null;
    }

    private String validateFile(AgentCommand command) {
        Map<String, Object> payload = command.getPayload();
        String path = (String) payload.get("path");

        if (path == null || path.isBlank()) {
            return "Chemin vide";
        }

        List<String> allowed = properties.getSecurity().getAllowedFilePaths();
        if (allowed == null || allowed.isEmpty()) {
            return "Aucun répertoire fichier autorisé configuré";
        }

        java.nio.file.Path normalized = java.nio.file.Paths.get(path).normalize();

        boolean isAllowed = allowed.stream()
                .anyMatch(prefix -> normalized.startsWith(java.nio.file.Paths.get(prefix).normalize()));

        if (!isAllowed) {
            log.warn("File path REJECTED: {}", path);
            return "Chemin non autorisé: " + path;
        }

        // Bloquer la traversée de répertoire
        if (path.contains("..")) {
            return "Traversée de répertoire détectée";
        }

        return null;
    }

    private String truncate(String s, int max) {
        return s.length() > max ? s.substring(0, max) + "..." : s;
    }
}
