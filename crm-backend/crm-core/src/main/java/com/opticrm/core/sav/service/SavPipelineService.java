package com.opticrm.core.sav.service;

import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.sav.agents.*;
import com.opticrm.core.sav.dto.AgentResult;
import com.opticrm.core.sav.entity.*;
import com.opticrm.core.sav.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavPipelineService {

    private final Agent1Receptionniste agent1;
    private final Agent2Classificateur agent2;
    private final Agent3Specialiste agent3;
    private final Agent4Diagnostiqueur agent4;
    private final Agent5Resolver agent5Resolver;
    private final Agent5Escaladeur agent5Escaladeur;

    private final SavTicketRepository ticketRepository;
    private final SavMessageRepository messageRepository;
    private final SavAgentLogRepository agentLogRepository;
    private final SavProfilClientRepository profilClientRepository;
    private final KbArticleRepository kbArticleRepository;
    private final AccountRepository accountRepository;

    @Async
    public CompletableFuture<SavTicket> runPipeline(String texteClient, UUID accountId, String canal) {
        long startTotal = System.currentTimeMillis();
        SavTicket ticket = null;

        try {
            Account account = accountRepository.findById(accountId)
                    .orElseThrow(() -> new IllegalArgumentException("Account not found: " + accountId));

            SavProfilClient profil = profilClientRepository.findByAccountId(accountId).orElse(null);
            String niveau = profil != null ? profil.getNiveauTechnique() : "INTERMEDIAIRE";

            // ── AGENT 1 — Réceptionniste ──────────────────────────────────
            long t1 = System.currentTimeMillis();
            AgentResult.Agent1Result r1 = agent1.run(texteClient);
            ticket = createTicket(texteClient, account, canal, r1);
            logAgent(ticket, "RECEPTIONNISTE", "SUCCES", texteClient, r1.toString(),
                    (int)(System.currentTimeMillis() - t1), null);

            // Sauvegarder l'accusé de réception
            saveMessage(ticket, "AGENT_IA",
                    "FR".equals(r1.getLangueDetectee())
                            ? r1.getMessageAccuseReceptionFr()
                            : r1.getMessageAccuseReceptionAr(),
                    r1.getLangueDetectee(), canal);

            // ── AGENT 2 — Classificateur ──────────────────────────────────
            long t2 = System.currentTimeMillis();
            AgentResult.Agent2Result r2 = agent2.run(r1.getProblemeExtrait(), texteClient);
            updateTicketClassification(ticket, r1, r2);
            logAgent(ticket, "CLASSIFICATEUR", "SUCCES", r1.getProblemeExtrait(), r2.toString(),
                    (int)(System.currentTimeMillis() - t2), null);

            // ── AGENT 3 — Spécialiste ─────────────────────────────────────
            long t3 = System.currentTimeMillis();
            AgentResult.Agent3Result r3 = agent3.run(r2.getDomaine(), r1.getProblemeExtrait(), texteClient);
            logAgent(ticket, "SPECIALISTE", "SUCCES", r2.getDomaine(), r3.toString(),
                    (int)(System.currentTimeMillis() - t3), null);

            // ── AGENT 4 — Diagnostiqueur ──────────────────────────────────
            long t4 = System.currentTimeMillis();
            AgentResult.Agent4Result r4 = agent4.run(r1, r2, r3);
            ticket.setScoreConfiance(r4.getScoreConfiance());
            ticket.setStatut("EN_ANALYSE");
            logAgent(ticket, "DIAGNOSTIQUEUR", "SUCCES", "", r4.getAction(),
                    (int)(System.currentTimeMillis() - t4), null);

            // ── AGENT 5 — Resolver ou Escaladeur ─────────────────────────
            if ("ESCALADE".equals(r4.getAction())) {
                ticket.setStatut("ESCALADE");
                ticketRepository.save(ticket);
                agent5Escaladeur.run(ticket, r1, r2, r3, r4);
                logAgent(ticket, "ESCALADEUR", "SUCCES", r4.getRaisonEscalade(), "ESCALADE créée",
                        (int)(System.currentTimeMillis() - t4), null);
            } else {
                AgentResult.KbSearchResult best = r4.getArticlePrincipal();
                kbArticleRepository.findById(UUID.fromString(best.getArticleId())).ifPresent(article -> {
                    AgentResult.Agent5ResolverResult r5 = agent5Resolver.run(article, niveau, r1.getLangueDetectee());
                    ticket.setKbArticle(article);
                    ticket.setSolutionProposee(r5.getSolutionFormattee());
                    ticket.setSolutionLangue(r5.getLangue());
                    ticket.setStatut("EN_COURS");
                    ticket.setDatePriseEnCharge(Instant.now());
                    ticketRepository.save(ticket);
                    saveMessage(ticket, "AGENT_IA", r5.getSolutionFormattee(), r5.getLangue(), canal);
                    logAgent(ticket, "RESOLVER", "SUCCES", article.getCodeArticle(), r5.getSolutionFormattee(),
                            0, null);
                });
            }

            log.info("[PIPELINE] Ticket {} traité en {}ms — action: {}",
                    ticket.getNumeroTicket(), System.currentTimeMillis() - startTotal, r4.getAction());
            return CompletableFuture.completedFuture(ticket);

        } catch (Exception e) {
            log.error("[PIPELINE] Erreur fatale: {}", e.getMessage(), e);
            if (ticket != null) {
                try {
                    agent5Escaladeur.runEmergency(ticket, e.getMessage());
                    ticket.setStatut("ESCALADE");
                    ticketRepository.save(ticket);
                    logAgent(ticket, "PIPELINE", "ERREUR", "", e.getMessage(), 0, e.getMessage());
                } catch (Exception ex) {
                    log.error("[PIPELINE] Erreur escalade urgence: {}", ex.getMessage());
                }
            }
            return CompletableFuture.failedFuture(e);
        }
    }

    @Transactional
    private SavTicket createTicket(String texteClient, Account account, String canal,
                                    AgentResult.Agent1Result r1) {
        String numero = generateNumeroTicket();
        SavTicket ticket = SavTicket.builder()
                .numeroTicket(numero)
                .account(account)
                .canalEntree(canal)
                .langueDetectee(r1.getLangueDetectee())
                .texteOriginal(texteClient)
                .texteNormalise(r1.getProblemeExtrait())
                .statut("OUVERT")
                .build();
        return ticketRepository.save(ticket);
    }

    private void updateTicketClassification(SavTicket ticket,
                                             AgentResult.Agent1Result r1,
                                             AgentResult.Agent2Result r2) {
        ticket.setDomaine(r2.getDomaine());
        ticket.setTypeTicket(r2.getTypeTicket());
        ticket.setCriticite(r2.getCriticite());
        ticket.setSlaHeures(r2.getSlaHeures());
        if (r2.getSlaHeures() != null) {
            ticket.setSlaEcheance(Instant.now().plusSeconds(r2.getSlaHeures() * 3600L));
        }
        ticketRepository.save(ticket);
    }

    private void saveMessage(SavTicket ticket, String expediteur, String contenu, String langue, String canal) {
        if (contenu == null || contenu.isBlank()) return;
        SavMessage msg = SavMessage.builder()
                .ticket(ticket)
                .expediteur(expediteur)
                .contenu(contenu)
                .langue(langue)
                .canal(canal)
                .build();
        messageRepository.save(msg);
    }

    private void logAgent(SavTicket ticket, String agentNom, String statut,
                           String input, String output, int dureeMs, String erreur) {
        SavAgentLog log_ = SavAgentLog.builder()
                .ticket(ticket)
                .agentNom(agentNom)
                .statut(statut)
                .inputJson(input != null && input.length() > 2000 ? input.substring(0, 2000) : input)
                .outputJson(output != null && output.length() > 2000 ? output.substring(0, 2000) : output)
                .dureeMs(dureeMs)
                .erreurMessage(erreur)
                .build();
        agentLogRepository.save(log_);
    }

    private String generateNumeroTicket() {
        String annee = DateTimeFormatter.ofPattern("yyyy").withZone(ZoneId.of("Africa/Casablanca")).format(Instant.now());
        Optional<Integer> maxSeq = ticketRepository.findMaxSequenceForYear(annee);
        int seq = maxSeq.map(s -> s + 1).orElse(1);
        return String.format("TK-%s-%04d", annee, seq);
    }
}
