package com.opticrm.agent.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opticrm.agent.config.AgentProperties;
import com.opticrm.agent.model.AgentCommand;
import com.opticrm.agent.model.AgentResponse;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Client WebSocket persistant vers le serveur CRM central.
 *
 * Fonctionnalités :
 * - Connexion automatique au démarrage
 * - Reconnexion automatique avec backoff exponentiel
 * - Envoi du message HELLO à la connexion
 * - Heartbeat PING/PONG périodique
 * - Dispatch des commandes reçues vers le CommandDispatcher
 * - File d'attente des réponses si déconnecté temporairement
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AgentWebSocketClient extends TextWebSocketHandler {

    private final AgentProperties properties;
    private final CommandDispatcher commandDispatcher;
    private final ObjectMapper objectMapper;

    private WebSocketSession currentSession;
    private final AtomicBoolean connected = new AtomicBoolean(false);
    private final AtomicBoolean shuttingDown = new AtomicBoolean(false);
    private final AtomicInteger reconnectAttempts = new AtomicInteger(0);

    /** File d'attente des réponses en cas de déconnexion temporaire */
    private final ConcurrentLinkedQueue<AgentResponse> pendingResponses = new ConcurrentLinkedQueue<>();

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
    private ScheduledFuture<?> heartbeatTask;

    // ───── Lifecycle ─────

    @PostConstruct
    public void init() {
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            log.error("============================================");
            log.error("  ERREUR: Clé API non configurée !");
            log.error("  Configurez sav-agent.api-key dans");
            log.error("  application.yml ou via AGENT_API_KEY");
            log.error("============================================");
            return;
        }

        // Connexion initiale avec un léger délai
        scheduler.schedule(this::connect, 2, TimeUnit.SECONDS);
    }

    @PreDestroy
    public void shutdown() {
        log.info("Agent shutdown requested...");
        shuttingDown.set(true);

        if (heartbeatTask != null) {
            heartbeatTask.cancel(false);
        }

        if (currentSession != null && currentSession.isOpen()) {
            try {
                currentSession.close(CloseStatus.GOING_AWAY);
            } catch (IOException e) {
                log.warn("Error closing WebSocket session", e);
            }
        }

        scheduler.shutdown();
    }

    // ───── Connection ─────

    /**
     * Établit la connexion WebSocket vers le serveur central.
     */
    public void connect() {
        if (shuttingDown.get()) return;

        try {
            String url = properties.getCentralUrl() + "?apiKey=" + properties.getApiKey();
            log.info("Connecting to CRM central: {}", properties.getCentralUrl());

            StandardWebSocketClient client = new StandardWebSocketClient();
            CompletableFuture<WebSocketSession> future =
                    client.execute(this, null, URI.create(url));

            future.whenComplete((session, error) -> {
                if (error != null) {
                    log.error("Connection failed: {}", error.getMessage());
                    scheduleReconnect();
                }
                // Success handled in afterConnectionEstablished
            });

        } catch (Exception e) {
            log.error("Connection error: {}", e.getMessage());
            scheduleReconnect();
        }
    }

    /**
     * Planifie une reconnexion avec backoff exponentiel.
     */
    private void scheduleReconnect() {
        if (shuttingDown.get()) return;

        int attempt = reconnectAttempts.incrementAndGet();
        int maxAttempts = properties.getReconnectMaxAttempts();

        if (maxAttempts > 0 && attempt > maxAttempts) {
            log.error("Max reconnect attempts ({}) reached. Giving up.", maxAttempts);
            return;
        }

        long baseDelay = properties.getReconnectDelayMs();
        double multiplier = properties.getReconnectBackoffMultiplier();
        long maxDelay = properties.getReconnectMaxDelayMs();

        long delay = Math.min((long) (baseDelay * Math.pow(multiplier, attempt - 1)), maxDelay);

        log.info("Reconnecting in {}ms (attempt {}/{})...",
                delay, attempt, maxAttempts > 0 ? maxAttempts : "∞");

        scheduler.schedule(this::connect, delay, TimeUnit.MILLISECONDS);
    }

    // ───── WebSocket Handler ─────

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        this.currentSession = session;
        this.connected.set(true);
        this.reconnectAttempts.set(0);

        log.info("═══════════════════════════════════════════");
        log.info("  Connected to CRM central !");
        log.info("  Session: {}", session.getId());
        log.info("  Agent: {}", properties.getAgentName());
        log.info("═══════════════════════════════════════════");

        // Envoyer le message HELLO
        sendHello(session);

        // Démarrer le heartbeat
        startHeartbeat();

        // Envoyer les réponses en attente
        flushPendingResponses();
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        log.debug("Message received: {}", payload.length() > 200
                ? payload.substring(0, 200) + "..." : payload);

        try {
            AgentCommand command = objectMapper.readValue(payload, AgentCommand.class);

            if (command.getCommandId() == null || command.getType() == null) {
                log.warn("Invalid command (missing commandId or type): {}", payload);
                return;
            }

            log.info("Command received: id={}, type={}", command.getCommandId(), command.getType());

            // Dispatch de la commande vers l'executor approprié (async)
            CompletableFuture.supplyAsync(() -> commandDispatcher.dispatch(command))
                    .thenAccept(this::sendResponse)
                    .exceptionally(ex -> {
                        log.error("Command execution error: {}", ex.getMessage(), ex);
                        sendResponse(AgentResponse.failed(
                                command.getCommandId(),
                                "EXECUTION_ERROR",
                                ex.getMessage()
                        ));
                        return null;
                    });

        } catch (Exception e) {
            log.error("Error parsing command: {}", e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        this.connected.set(false);
        this.currentSession = null;

        log.warn("Disconnected from CRM central: {}", status);

        // Arrêter le heartbeat
        if (heartbeatTask != null) {
            heartbeatTask.cancel(false);
        }

        // Tenter la reconnexion
        if (!shuttingDown.get()) {
            scheduleReconnect();
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("Transport error: {}", exception.getMessage());
        connected.set(false);
    }

    // ───── Sending messages ─────

    /**
     * Envoie une réponse au serveur central.
     * Si déconnecté, met en file d'attente.
     */
    public void sendResponse(AgentResponse response) {
        if (connected.get() && currentSession != null && currentSession.isOpen()) {
            try {
                String json = objectMapper.writeValueAsString(response);
                currentSession.sendMessage(new TextMessage(json));
                log.debug("Response sent: commandId={}, status={}", response.getCommandId(), response.getStatus());
            } catch (IOException e) {
                log.error("Error sending response, queuing: {}", e.getMessage());
                pendingResponses.offer(response);
            }
        } else {
            log.warn("Not connected, queuing response for commandId={}", response.getCommandId());
            pendingResponses.offer(response);
        }
    }

    /**
     * Envoie le message HELLO avec les métadonnées de l'agent.
     */
    private void sendHello(WebSocketSession session) {
        try {
            Map<String, Object> hello = Map.of(
                    "type", "HELLO",
                    "version", "1.0.0",
                    "os", System.getProperty("os.name") + " " + System.getProperty("os.version"),
                    "hostname", java.net.InetAddress.getLocalHost().getHostName(),
                    "javaVersion", System.getProperty("java.version"),
                    "supportedCommands", commandDispatcher.getSupportedCommands()
            );

            String json = objectMapper.writeValueAsString(hello);
            session.sendMessage(new TextMessage(json));
            log.info("HELLO sent: {}", hello);

        } catch (Exception e) {
            log.error("Error sending HELLO", e);
        }
    }

    /**
     * Envoie les réponses en attente après reconnexion.
     */
    private void flushPendingResponses() {
        int count = 0;
        AgentResponse response;
        while ((response = pendingResponses.poll()) != null) {
            sendResponse(response);
            count++;
        }
        if (count > 0) {
            log.info("Flushed {} pending responses", count);
        }
    }

    // ───── Heartbeat ─────

    private void startHeartbeat() {
        if (heartbeatTask != null) {
            heartbeatTask.cancel(false);
        }

        int interval = properties.getHeartbeatIntervalSeconds();

        heartbeatTask = scheduler.scheduleAtFixedRate(() -> {
            if (connected.get() && currentSession != null && currentSession.isOpen()) {
                try {
                    Map<String, Object> ping = Map.of(
                            "type", "PONG",  // On répond PONG au heartbeat du serveur
                            "sentAt", System.currentTimeMillis()
                    );
                    String json = objectMapper.writeValueAsString(ping);
                    currentSession.sendMessage(new TextMessage(json));
                    log.debug("Heartbeat sent");
                } catch (IOException e) {
                    log.warn("Heartbeat failed: {}", e.getMessage());
                }
            }
        }, interval, interval, TimeUnit.SECONDS);

        log.info("Heartbeat started (every {}s)", interval);
    }

    // ───── Status ─────

    public boolean isConnected() {
        return connected.get();
    }

    public int getPendingResponseCount() {
        return pendingResponses.size();
    }

    public int getReconnectAttempts() {
        return reconnectAttempts.get();
    }
}
