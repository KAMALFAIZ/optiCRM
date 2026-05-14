package com.opticrm.agent.executor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opticrm.agent.config.AgentProperties;
import com.opticrm.agent.model.AgentCommand;
import com.opticrm.agent.model.AgentResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Exécute des requêtes HTTP vers des API locales du client
 * (ERP, Sage, POS, systèmes tiers sur le LAN).
 */
@Slf4j
@Component
public class HttpRequestExecutor implements CommandExecutor {

    private final AgentProperties properties;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public HttpRequestExecutor(AgentProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;

        AgentProperties.LocalHttp httpConfig = properties.getLocalHttp();

        this.webClient = WebClient.builder()
                .baseUrl(httpConfig.getBaseUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();

        log.info("HTTP Executor initialized, base URL: {}", httpConfig.getBaseUrl());
    }

    @Override
    public AgentResponse execute(AgentCommand command) {
        if (!properties.getLocalHttp().isEnabled()) {
            return AgentResponse.failed(command.getCommandId(),
                    "HTTP_DISABLED", "Les appels HTTP locaux ne sont pas activés sur cet agent");
        }

        Map<String, Object> payload = command.getPayload();
        String method = ((String) payload.getOrDefault("method", "GET")).toUpperCase();
        String url = (String) payload.get("url");
        Object body = payload.get("body");

        @SuppressWarnings("unchecked")
        Map<String, String> headers = (Map<String, String>) payload.getOrDefault("headers", Map.of());

        if (url == null || url.isBlank()) {
            return AgentResponse.failed(command.getCommandId(),
                    "INVALID_URL", "L'URL est vide");
        }

        log.info("Executing HTTP {} {}", method, url);

        try {
            Duration timeout = Duration.ofMillis(properties.getLocalHttp().getReadTimeoutMs());

            WebClient.RequestBodySpec requestSpec = webClient
                    .method(HttpMethod.valueOf(method))
                    .uri(url);

            // Ajouter les headers personnalisés
            headers.forEach(requestSpec::header);

            // Ajouter le body si nécessaire
            Mono<String> responseMono;
            if (body != null && (method.equals("POST") || method.equals("PUT") || method.equals("PATCH"))) {
                String bodyJson = body instanceof String
                        ? (String) body
                        : objectMapper.writeValueAsString(body);
                responseMono = requestSpec
                        .bodyValue(bodyJson)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(timeout);
            } else {
                responseMono = requestSpec
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(timeout);
            }

            String responseBody = responseMono.block();

            // Parser le body de réponse
            Object parsedBody;
            try {
                parsedBody = objectMapper.readValue(responseBody, Object.class);
            } catch (Exception e) {
                parsedBody = responseBody; // garder comme string si non-JSON
            }

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("statusCode", 200);
            data.put("body", parsedBody);

            return AgentResponse.success(command.getCommandId(), data, 0);

        } catch (Exception e) {
            log.error("HTTP request failed: {} {} - {}", method, url, e.getMessage());
            return AgentResponse.failed(command.getCommandId(),
                    "HTTP_ERROR", e.getMessage());
        }
    }
}
