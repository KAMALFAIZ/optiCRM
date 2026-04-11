package com.opticrm.core.sav.agents;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opticrm.core.sav.config.SavProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Client HTTP pour l'API Claude (Anthropic).
 * Extrait le JSON de la réponse de l'agent.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ClaudeClient {

    private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
    private static final String ANTHROPIC_VERSION = "2023-06-01";

    @Value("${ANTHROPIC_API_KEY:}")
    private String apiKey;

    private final SavProperties savProperties;
    private final ObjectMapper objectMapper;

    /**
     * Appel Claude avec system prompt + user message.
     * Retourne le texte brut de la réponse.
     */
    @SuppressWarnings("unchecked")
    public String call(String systemPrompt, String userMessage) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", apiKey);
            headers.set("anthropic-version", ANTHROPIC_VERSION);

            Map<String, Object> body = Map.of(
                    "model", savProperties.getClaude().getModel(),
                    "max_tokens", 2048,
                    "system", systemPrompt,
                    "messages", List.of(Map.of("role", "user", "content", userMessage))
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            Map<String, Object> response = restTemplate.postForObject(ANTHROPIC_API_URL, request, Map.class);

            if (response != null && response.containsKey("content")) {
                List<Map<String, Object>> content = (List<Map<String, Object>>) response.get("content");
                if (!content.isEmpty()) {
                    String text = (String) content.get(0).get("text");
                    log.debug("Claude response: {}", text);
                    return text;
                }
            }
        } catch (Exception e) {
            log.error("Erreur appel Claude API: {}", e.getMessage());
            throw new RuntimeException("Erreur Claude API: " + e.getMessage(), e);
        }
        return "{}";
    }

    /**
     * Extrait le JSON d'une réponse Claude (qui peut contenir du texte avant/après).
     */
    public String extractJson(String text) {
        if (text == null) return "{}";
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end >= start) {
            return text.substring(start, end + 1);
        }
        return "{}";
    }

    /**
     * Appel Claude et parse directement en objet Java.
     */
    public <T> T callAndParse(String systemPrompt, String userMessage, Class<T> clazz) {
        String raw = call(systemPrompt, userMessage);
        String json = extractJson(raw);
        try {
            return objectMapper.readValue(json, clazz);
        } catch (Exception e) {
            log.error("Erreur parsing réponse Claude en {}: {} — réponse: {}", clazz.getSimpleName(), e.getMessage(), json);
            throw new RuntimeException("Parsing agent response failed", e);
        }
    }
}
