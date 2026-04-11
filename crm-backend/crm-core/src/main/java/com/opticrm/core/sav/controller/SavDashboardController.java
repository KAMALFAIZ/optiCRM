package com.opticrm.core.sav.controller;

import com.opticrm.core.sav.entity.SavEscalade;
import com.opticrm.core.sav.entity.SavMessage;
import com.opticrm.core.sav.entity.SavTicket;
import com.opticrm.core.sav.repository.SavEscaladeRepository;
import com.opticrm.core.sav.repository.SavMessageRepository;
import com.opticrm.core.sav.repository.SavTicketRepository;
import com.opticrm.core.sav.service.SavDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Dashboard KASOFT team — réservé KASOFT uniquement (filtre par rôle).
 * URL : /api/v1/sav/dashboard/...
 */
@RestController
@RequestMapping("/api/v1/sav/dashboard")
@RequiredArgsConstructor
@Tag(name = "SAV Dashboard", description = "Dashboard KASOFT team — KASOFT uniquement")
@PreAuthorize("hasRole('ADMIN') or hasRole('KASOFT_TEAM')")
public class SavDashboardController {

    private final SavDashboardService dashboardService;
    private final SavTicketRepository ticketRepository;
    private final SavEscaladeRepository escaladeRepository;
    private final SavMessageRepository messageRepository;

    @GetMapping("/stats")
    @Operation(summary = "Statistiques globales SAV")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStats());
    }

    @GetMapping("/tickets")
    @Operation(summary = "Liste tous les tickets SAV")
    public ResponseEntity<List<Map<String, Object>>> getTickets(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(dashboardService.getRecentTickets(limit));
    }

    @GetMapping("/tickets/{id}")
    @Operation(summary = "Détail d'un ticket (vue KASOFT)")
    public ResponseEntity<?> getTicketDetail(@PathVariable UUID id) {
        return ticketRepository.findById(id).map(ticket -> {
            List<SavMessage> messages = messageRepository.findByTicketIdOrderByDateEnvoiAsc(id);
            return ResponseEntity.ok(Map.of(
                    "ticket", ticket,
                    "messages", messages
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/tickets/{id}/reply")
    @Operation(summary = "Répondre à un ticket (intervention Kamal)")
    public ResponseEntity<?> replyToTicket(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {

        SavTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket non trouvé"));

        SavMessage msg = SavMessage.builder()
                .ticket(ticket)
                .expediteur("KAMAL")
                .contenu(body.get("contenu"))
                .langue(body.getOrDefault("langue", "FR"))
                .canal("WEB")
                .build();
        messageRepository.save(msg);

        ticket.setStatut("EN_COURS");
        ticket.setDatePriseEnCharge(Instant.now());
        ticketRepository.save(ticket);

        return ResponseEntity.ok(Map.of("status", "sent"));
    }

    @PostMapping("/tickets/{id}/resolve")
    @Operation(summary = "Marquer un ticket comme résolu par Kamal")
    public ResponseEntity<?> resolveTicket(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {

        SavTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket non trouvé"));

        ticket.setStatut("RESOLU");
        ticket.setResoluPar("KAMAL");
        ticket.setDateResolution(Instant.now());
        ticket.setNotesInternes(body.get("notes"));
        ticketRepository.save(ticket);

        return ResponseEntity.ok(Map.of("statut", "RESOLU"));
    }

    @GetMapping("/escalades")
    @Operation(summary = "Escalades en attente")
    public ResponseEntity<List<SavEscalade>> getEscalades() {
        return ResponseEntity.ok(escaladeRepository.findByStatutOrderByCreatedAtDesc("EN_ATTENTE"));
    }

    @PostMapping("/escalades/{id}/prendre-en-charge")
    @Operation(summary = "Prendre en charge une escalade")
    public ResponseEntity<?> prendreEnCharge(@PathVariable UUID id) {
        SavEscalade esc = escaladeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Escalade non trouvée"));
        esc.setStatut("PRIS_EN_CHARGE");
        esc.setDatePriseEnCharge(Instant.now());
        escaladeRepository.save(esc);

        esc.getTicket().setStatut("EN_COURS");
        esc.getTicket().setDatePriseEnCharge(Instant.now());
        ticketRepository.save(esc.getTicket());

        return ResponseEntity.ok(Map.of("statut", "PRIS_EN_CHARGE"));
    }
}
