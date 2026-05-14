package com.opticrm.agent.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuration typée de l'agent local.
 * Lue depuis application.yml ou variables d'environnement.
 *
 * Préfixe : sav-agent.*
 */
@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "sav-agent")
public class AgentProperties {

    // ───── Connexion au serveur central ─────

    /** URL WebSocket du serveur CRM central */
    @NotBlank(message = "L'URL du serveur central est obligatoire")
    private String centralUrl = "wss://crm.example.com/ws/agent";

    /** Clé API de l'agent (fournie à l'enregistrement) */
    @NotBlank(message = "La clé API est obligatoire")
    private String apiKey;

    /** Nom lisible de l'agent (affiché dans le dashboard) */
    @NotBlank(message = "Le nom de l'agent est obligatoire")
    private String agentName = "SAV-Agent-Default";

    // ───── Reconnexion ─────

    /** Délai initial avant reconnexion (ms) */
    @Positive
    private long reconnectDelayMs = 5_000;

    /** Délai maximum entre tentatives de reconnexion (ms) */
    @Positive
    private long reconnectMaxDelayMs = 60_000;

    /** Facteur multiplicateur pour le backoff exponentiel */
    private double reconnectBackoffMultiplier = 1.5;

    /** Nombre max de tentatives avant abandon (0 = infini) */
    private int reconnectMaxAttempts = 0;

    // ───── Base de données locale ─────

    private LocalDatabase localDatabase = new LocalDatabase();

    // ───── Sécurité ─────

    private Security security = new Security();

    // ───── HTTP client local ─────

    private LocalHttp localHttp = new LocalHttp();

    // ───── Shell ─────

    private Shell shell = new Shell();

    // ───── Heartbeat ─────

    /** Intervalle du heartbeat ping en secondes */
    @Positive
    private int heartbeatIntervalSeconds = 30;

    // ───── Classes imbriquées ─────

    @Getter
    @Setter
    public static class LocalDatabase {

        /** Activer l'exécution de requêtes SQL locales */
        private boolean enabled = true;

        /** URL JDBC de la base locale */
        private String url;

        /** Utilisateur (de préférence en lecture seule) */
        private String username;

        /** Mot de passe */
        private String password;

        /** Timeout des requêtes en secondes */
        @Positive
        private int queryTimeoutSeconds = 30;

        /** Nombre max de lignes retournées */
        @Positive
        private int maxRows = 10_000;
    }

    @Getter
    @Setter
    public static class Security {

        /** Liste blanche des requêtes SQL autorisées (patterns regex) */
        private List<String> allowedSqlPatterns = new ArrayList<>();

        /** Liste blanche des URLs HTTP locales autorisées (prefixes) */
        private List<String> allowedHttpPrefixes = new ArrayList<>();

        /** Liste blanche des commandes shell autorisées (exact match) */
        private List<String> allowedShellCommands = new ArrayList<>();

        /** Répertoires autorisés pour les opérations fichier */
        private List<String> allowedFilePaths = new ArrayList<>();

        /** Rejeter toute commande non whitelistée (mode strict) */
        private boolean strictMode = true;
    }

    @Getter
    @Setter
    public static class LocalHttp {

        /** Activer les appels HTTP locaux */
        private boolean enabled = true;

        /** URL de base pour les appels locaux (ex: http://localhost:8090) */
        private String baseUrl = "http://localhost";

        /** Timeout de connexion en ms */
        @Positive
        private int connectTimeoutMs = 5_000;

        /** Timeout de lecture en ms */
        @Positive
        private int readTimeoutMs = 30_000;
    }

    @Getter
    @Setter
    public static class Shell {

        /** Activer l'exécution de commandes shell */
        private boolean enabled = false;

        /** Répertoire de travail par défaut */
        private String workingDirectory;

        /** Timeout en secondes */
        @Positive
        private int timeoutSeconds = 60;
    }
}
