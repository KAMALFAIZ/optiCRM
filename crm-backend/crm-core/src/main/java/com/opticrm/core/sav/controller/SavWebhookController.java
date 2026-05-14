package com.opticrm.core.sav.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Webhook WhatsApp Business API — PHASE 2 (stub prêt).
 * URL : /api/v1/sav/webhook/whatsapp
 */
@RestController
@RequestMapping("/api/v1/sav/webhook")
@Tag(name = "SAV Webhook", description = "Webhook WhatsApp Business — Phase 2 stub")
@Slf4j
public class SavWebhookController {

    @Value("${sav.whatsapp.verify-token:kasoft-sav-verify-token}")
    private String verifyToken;

    @GetMapping("/whatsapp")
    @Operation(summary = "Vérification webhook Meta WhatsApp")
    public ResponseEntity<String> verifyWebhook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.challenge") String challenge,
            @RequestParam("hub.verify_token") String token) {

        if ("subscribe".equals(mode) && verifyToken.equals(token)) {
            log.info("[WEBHOOK-WA] Vérification réussie");
            return ResponseEntity.ok(challenge);
        }
        return ResponseEntity.status(403).body("Forbidden");
    }

    @PostMapping("/whatsapp")
    @Operation(summary = "Réception message WhatsApp (Phase 2)")
    public ResponseEntity<String> receiveMessage(@RequestBody Map<String, Object> payload) {
        // PHASE 1 : log uniquement
        log.info("[WEBHOOK-WA] Message reçu: {}", payload);

        /*
         * PHASE 2 — Implémenter :
         * 1. Parser le payload Meta WhatsApp Business API
         * 2. Extraire : numéro expéditeur, texte message, timestamp
         * 3. Identifier le client via tel_whatsapp dans sav_auth_clients
         * 4. Si ticket EN_COURS pour ce client :
         *    - Si "NON" → escalader
         *    - Si "OUI"/"merci" → fermer ticket + demander évaluation
         *    - Sinon → ajouter message au ticket existant
         * 5. Si pas de ticket actif → démarrer pipeline agent1
         */

        return ResponseEntity.ok("EVENT_RECEIVED");
    }
}
