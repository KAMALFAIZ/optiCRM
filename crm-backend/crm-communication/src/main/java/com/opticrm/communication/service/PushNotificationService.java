package com.opticrm.communication.service;

import com.opticrm.communication.entity.PushSubscription;
import com.opticrm.communication.repository.PushSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.UUID;

/**
 * Service d'envoi de notifications push via le protocole Web Push.
 * Utilise java.net.http.HttpClient pour envoyer les payloads aux endpoints.
 * Note : pour la production, ajouter le support VAPID avec une librairie comme web-push-java.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PushNotificationService {

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * Envoie une notification push à tous les appareils d'un utilisateur.
     */
    public void sendToUser(UUID userId, String title, String message, String link) {
        List<PushSubscription> subs = pushSubscriptionRepository.findByUserId(userId);
        if (subs.isEmpty()) return;

        String payload = String.format(
            "{\"title\":\"%s\",\"message\":\"%s\",\"link\":\"%s\"}",
            escapeJson(title), escapeJson(message), escapeJson(link != null ? link : "")
        );

        for (PushSubscription sub : subs) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(sub.getEndpoint()))
                        .header("Content-Type", "application/json")
                        .header("TTL", "86400")
                        .POST(HttpRequest.BodyPublishers.ofString(payload))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 410) {
                    // Subscription expirée — supprimer
                    pushSubscriptionRepository.delete(sub);
                    log.info("Push subscription expirée supprimée: {}", sub.getEndpoint());
                } else if (response.statusCode() >= 400) {
                    log.warn("Erreur push vers {} : HTTP {}", sub.getEndpoint(), response.statusCode());
                }
            } catch (Exception e) {
                log.error("Erreur envoi push à {}: {}", sub.getEndpoint(), e.getMessage());
            }
        }
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
