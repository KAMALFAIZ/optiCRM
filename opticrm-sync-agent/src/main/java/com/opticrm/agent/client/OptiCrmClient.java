package com.opticrm.agent.client;

import com.opticrm.agent.config.AgentProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OptiCrmClient {

    private final AgentProperties props;

    /** WebClient construit à chaque appel pour utiliser la config courante (modifiable via la GUI). */
    private WebClient client() {
        String baseUrl = props.getOpticrm().getServerUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new IllegalStateException("URL serveur OptiCRM non configurée");
        }
        String key = props.getOpticrm().getAgentKey();
        if (key == null || key.isBlank()) {
            throw new IllegalStateException("Clé d'agent non configurée");
        }

        HttpClient http = HttpClient.create(ConnectionProvider.newConnection())
                .responseTimeout(Duration.ofSeconds(30));

        return WebClient.builder()
                .baseUrl(baseUrl.trim())
                .defaultHeader("X-Agent-Key", key.trim())
                .defaultHeader("X-Agent-Version", "1.0.0")
                .codecs(c -> c.defaultCodecs().maxInMemorySize(50 * 1024 * 1024))
                .clientConnector(new org.springframework.http.client.reactive.ReactorClientHttpConnector(http))
                .build();
    }

    public Mono<Map> register() {
        return client().post()
                .uri("/api/v1/agent/register")
                .bodyValue(Map.of("agentVersion", "1.0.0", "osName", System.getProperty("os.name")))
                .retrieve()
                .bodyToMono(Map.class);
    }

    public Mono<Map> heartbeat(String sageStatus, String sageMessage) {
        return client().post()
                .uri("/api/v1/agent/heartbeat")
                .bodyValue(Map.of(
                        "agentVersion", "1.0.0",
                        "osName", System.getProperty("os.name"),
                        "sageStatus", sageStatus,
                        "sageMessage", sageMessage == null ? "" : sageMessage
                ))
                .retrieve().bodyToMono(Map.class);
    }

    public Mono<Map> pushSageData(String entityType, List<Map<String, Object>> rows) {
        return client().post()
                .uri(uri -> uri.path("/api/v1/sage/push").queryParam("autoApply", true).build())
                .bodyValue(Map.of(
                        "entityType", entityType,
                        "sourceFormat", "SAGE_AGENT",
                        "label", "Pull agent — " + entityType,
                        "rows", rows
                ))
                .retrieve().bodyToMono(Map.class);
    }

    public Mono<Map> pullPendingExports(int limit) {
        return client().get()
                .uri(uri -> uri.path("/api/v1/agent/pending-exports").queryParam("limit", limit).build())
                .retrieve().bodyToMono(Map.class);
    }

    public Mono<Map> sendExportResult(String exportId, String status,
                                       String sagePiece, String errorMessage) {
        return client().post()
                .uri("/api/v1/agent/export-result")
                .bodyValue(Map.of(
                        "exportId", exportId,
                        "status", status,
                        "sagePiece", sagePiece == null ? "" : sagePiece,
                        "errorMessage", errorMessage == null ? "" : errorMessage
                ))
                .retrieve().bodyToMono(Map.class);
    }
}
