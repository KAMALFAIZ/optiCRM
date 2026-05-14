package com.opticrm.core.sav.controller;

import com.opticrm.core.sav.entity.SavAuthClient;
import com.opticrm.core.sav.entity.SavMessage;
import com.opticrm.core.sav.entity.SavTicket;
import com.opticrm.core.sav.repository.SavMessageRepository;
import com.opticrm.core.sav.repository.SavTicketRepository;
import com.opticrm.core.sav.service.SavAuthService;
import com.opticrm.core.sav.service.SavPipelineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Portail public SAV — accessible sans auth OptiCRM interne.
 * URL : /api/v1/sav/portal/...
 */
@RestController
@RequestMapping("/api/v1/sav/portal")
@RequiredArgsConstructor
@Tag(name = "SAV Portal", description = "Portail client SAV KASOFT — public")
public class SavPortalController {

    private final SavAuthService authService;
    private final SavPipelineService pipelineService;
    private final SavTicketRepository ticketRepository;
    private final SavMessageRepository messageRepository;

    // ── Authentification OTP ─────────────────────────────────────────────

    @PostMapping("/auth/request-otp")
    @Operation(summary = "Demander un OTP WhatsApp")
    public ResponseEntity<Map<String, Object>> requestOtp(@RequestBody Map<String, String> body) {
        String tel = body.get("tel_whatsapp");
        if (tel == null || tel.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Numéro WhatsApp requis"));
        }
        Map<String, Object> result = authService.requestOtp(tel);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/auth/verify-otp")
    @Operation(summary = "Vérifier le code OTP")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody Map<String, String> body) {
        String tel = body.get("tel_whatsapp");
        String otp = body.get("otp");
        if (tel == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Paramètres manquants"));
        }
        Map<String, Object> result = authService.verifyOtp(tel, otp);
        return ResponseEntity.ok(result);
    }

    // ── Soumission ticket ─────────────────────────────────────────────────

    @PostMapping("/tickets")
    @Operation(summary = "Soumettre un nouveau ticket SAV")
    public ResponseEntity<Map<String, Object>> submitTicket(
            @RequestHeader("X-SAV-Token") String sessionToken,
            @RequestBody Map<String, String> body) {

        SavAuthClient auth = authService.validateToken(sessionToken);
        String texte = body.get("texte");
        String canal = body.getOrDefault("canal", "WEB");

        if (texte == null || texte.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Description du problème requise"));
        }

        // Lancer le pipeline de manière asynchrone
        pipelineService.runPipeline(texte, auth.getAccount().getId(), canal);

        return ResponseEntity.accepted().body(Map.of(
                "message", "Votre demande a bien été reçue. Traitement en cours...",
                "status", "PROCESSING"
        ));
    }

    // ── Suivi ticket ──────────────────────────────────────────────────────

    @GetMapping("/tickets/{numero}")
    @Operation(summary = "Suivi d'un ticket par numéro")
    public ResponseEntity<?> getTicket(
            @RequestHeader("X-SAV-Token") String sessionToken,
            @PathVariable String numero) {

        SavAuthClient auth = authService.validateToken(sessionToken);
        SavTicket ticket = ticketRepository.findByNumeroTicket(numero)
                .orElse(null);

        if (ticket == null || !ticket.getAccount().getId().equals(auth.getAccount().getId())) {
            return ResponseEntity.notFound().build();
        }

        List<SavMessage> messages = messageRepository.findByTicketIdOrderByDateEnvoiAsc(ticket.getId());

        return ResponseEntity.ok(Map.of(
                "ticket", buildTicketDto(ticket),
                "messages", messages.stream().map(m -> Map.of(
                        "expediteur", m.getExpediteur(),
                        "contenu", m.getContenu(),
                        "langue", m.getLangue(),
                        "date", m.getDateEnvoi()
                )).collect(Collectors.toList())
        ));
    }

    @GetMapping("/tickets")
    @Operation(summary = "Historique des tickets du client")
    public ResponseEntity<?> getMyTickets(@RequestHeader("X-SAV-Token") String sessionToken) {
        SavAuthClient auth = authService.validateToken(sessionToken);
        List<SavTicket> tickets = ticketRepository.findByAccountIdOrderByCreatedAtDesc(
                auth.getAccount().getId());

        return ResponseEntity.ok(tickets.stream().map(this::buildTicketDto).collect(Collectors.toList()));
    }

    // ── Confirmation résolution ───────────────────────────────────────────

    @PostMapping("/tickets/{numero}/confirm")
    @Operation(summary = "Confirmer la résolution d'un ticket")
    public ResponseEntity<?> confirmResolution(
            @RequestHeader("X-SAV-Token") String sessionToken,
            @PathVariable String numero,
            @RequestBody Map<String, Object> body) {

        SavAuthClient auth = authService.validateToken(sessionToken);
        SavTicket ticket = ticketRepository.findByNumeroTicket(numero)
                .filter(t -> t.getAccount().getId().equals(auth.getAccount().getId()))
                .orElseThrow(() -> new IllegalArgumentException("Ticket non trouvé"));

        boolean resolved = Boolean.TRUE.equals(body.get("resolved"));
        if (resolved) {
            ticket.setStatut("RESOLU");
            ticket.setConfirmedResolution(true);
            ticket.setResoluPar("IA");
            ticket.setDateResolution(java.time.Instant.now());
        } else {
            // Client dit NON → escalade
            ticket.setStatut("ESCALADE");
        }
        ticketRepository.save(ticket);

        return ResponseEntity.ok(Map.of("statut", ticket.getStatut()));
    }

    private Map<String, Object> buildTicketDto(SavTicket t) {
        return Map.of(
                "id", t.getId(),
                "numero", t.getNumeroTicket(),
                "statut", t.getStatut(),
                "domaine", t.getDomaine() != null ? t.getDomaine() : "",
                "criticite", t.getCriticite() != null ? t.getCriticite() : "",
                "created_at", t.getCreatedAt(),
                "solution_proposee", t.getSolutionProposee() != null ? t.getSolutionProposee() : ""
        );
    }
}
