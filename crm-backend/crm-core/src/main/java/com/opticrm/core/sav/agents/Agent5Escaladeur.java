package com.opticrm.core.sav.agents;

import com.opticrm.core.sav.dto.AgentResult;
import com.opticrm.core.sav.entity.SavEscalade;
import com.opticrm.core.sav.entity.SavTicket;
import com.opticrm.core.sav.repository.SavEscaladeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class Agent5Escaladeur {

    private final ClaudeClient claudeClient;
    private final SavEscaladeRepository escaladeRepository;

    private static final String SYSTEM_PROMPT = """
            Tu es un assistant KASOFT. Prépare un dossier d'escalade structuré et concis pour le technicien Kamal.
            Inclure : résumé du problème, analyse IA, raison de l'escalade.
            Sois direct et factuel. Format markdown.
            """;

    public SavEscalade run(SavTicket ticket,
                           AgentResult.Agent1Result r1,
                           AgentResult.Agent2Result r2,
                           AgentResult.Agent3Result r3,
                           AgentResult.Agent4Result r4) {
        log.info("[AGENT5-ESCALADEUR] Préparation escalade ticket {}", ticket.getNumeroTicket());

        String dossier = buildDossier(ticket, r1, r2, r3, r4);

        SavEscalade escalade = SavEscalade.builder()
                .ticket(ticket)
                .raisonEscalade(r4.getRaisonEscalade())
                .scoreConfiance(r4.getScoreConfiance())
                .dossierComplet(dossier)
                .statut("EN_ATTENTE")
                .notifDashboardEnvoye(true)
                .build();

        return escaladeRepository.save(escalade);
    }

    public SavEscalade runEmergency(SavTicket ticket, String raison) {
        log.warn("[AGENT5-ESCALADEUR] Escalade urgence ticket {} — {}", ticket.getNumeroTicket(), raison);

        SavEscalade escalade = SavEscalade.builder()
                .ticket(ticket)
                .raisonEscalade("TIMEOUT/ERREUR PIPELINE: " + raison)
                .scoreConfiance(0.0)
                .dossierComplet("Escalade automatique suite à une erreur du pipeline IA.\nRaison : " + raison)
                .statut("EN_ATTENTE")
                .build();

        return escaladeRepository.save(escalade);
    }

    private String buildDossier(SavTicket ticket,
                                 AgentResult.Agent1Result r1,
                                 AgentResult.Agent2Result r2,
                                 AgentResult.Agent3Result r3,
                                 AgentResult.Agent4Result r4) {
        String hypotheses = r3.getHypothesesCauses() != null
                ? r3.getHypothesesCauses().stream().map(h -> "- " + h).collect(Collectors.joining("\n"))
                : "Non disponibles";

        String template = String.format("""
                🔴 ESCALADE %s — %s
                ━━━━━━━━━━━━━━━━━━━━━━━
                👤 Client   : %s
                📦 Domaine  : %s
                🏷️  Type     : %s
                ⏰ SLA      : %s
                ━━━━━━━━━━━━━━━━━━━━━━━
                📋 PROBLÈME :
                %s

                🔍 ANALYSE IA :
                %s

                ❌ RAISON ESCALADE :
                Score KB : %.0f%% < seuil
                %s
                ━━━━━━━━━━━━━━━━━━━━━━━
                """,
                ticket.getNumeroTicket(),
                ticket.getCriticite(),
                ticket.getAccount() != null ? ticket.getAccount().getName() : "Inconnu",
                r2.getDomaine(),
                r2.getTypeTicket(),
                ticket.getSlaEcheance() != null ? ticket.getSlaEcheance().toString() : "N/A",
                r1.getProblemeExtrait(),
                hypotheses,
                r4.getScoreConfiance() != null ? r4.getScoreConfiance() * 100 : 0,
                r4.getRaisonEscalade() != null ? r4.getRaisonEscalade() : ""
        );

        // Enrichir avec Claude si disponible
        try {
            return claudeClient.call(SYSTEM_PROMPT,
                    "Reformule ce dossier d'escalade en markdown structuré :\n\n" + template);
        } catch (Exception e) {
            return template;
        }
    }
}
