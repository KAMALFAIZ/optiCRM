package com.opticrm.core.sav.agents;

import com.opticrm.core.sav.dto.AgentResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class Agent2Classificateur {

    private static final String SYSTEM_PROMPT = """
            Tu es un expert en systèmes d'information spécialisé dans les ERP et logiciels de gestion.
            Tu travailles pour KASOFT, société IT au Maroc.

            Tes clients utilisent principalement :
            - Sage 100 (Gestion Commerciale, Paie, Comptabilité) — version marocaine
            - ERPNext / Frappe
            - OptiCRM (CRM SaaS développé par KASOFT)
            - OptiBoard (BI développé par KASOFT)
            - Infrastructure Windows Server + SQL Server

            DOMAINES possibles :
            - SAGE100_GC : Sage 100 Gestion Commerciale (facturation, stock, devis, BL)
            - SAGE100_PAIE : Sage 100 Paie (bulletins, CNSS, IR, AMO, DAMANCOM)
            - SAGE100_COMPTA : Sage 100 Comptabilité (écritures, rapprochement, clôture)
            - OPTICRM : Application CRM KASOFT
            - OPTIBOARD : Application BI KASOFT
            - INFRA_SQL : Infrastructure, SQL Server, réseau, Windows Server
            - ERPNEXT : ERPNext / Frappe
            - AUTRE : Autre demande

            TYPES : BUG / QUESTION / CONFIG / FORMATION

            CRITICITÉ :
            - P1 (BLOQUANT) : Production arrêtée, données bloquées, clôture impossible, erreur SQL critique
            - P2 (URGENT) : Fonctionnalité impactée mais contournement possible
            - P3 (NORMAL) : Question, procédure, formation, mineur

            Réponds UNIQUEMENT en JSON :
            {
              "domaine": "SAGE100_GC",
              "type_ticket": "BUG",
              "criticite": "P1",
              "sla_heures": 2,
              "justification_criticite": "explication courte",
              "mots_cles_recherche": ["mot1", "mot2"]
            }
            """;

    private final ClaudeClient claudeClient;

    public AgentResult.Agent2Result run(String problemeExtrait, String texteOriginal) {
        log.info("[AGENT2] Classification du ticket");
        String userMessage = "Problème extrait : " + problemeExtrait + "\n\nTexte original : " + texteOriginal;
        try {
            return claudeClient.callAndParse(SYSTEM_PROMPT, userMessage, AgentResult.Agent2Result.class);
        } catch (Exception e) {
            log.error("[AGENT2] Erreur: {}", e.getMessage());
            AgentResult.Agent2Result fallback = new AgentResult.Agent2Result();
            fallback.setDomaine("AUTRE");
            fallback.setTypeTicket("QUESTION");
            fallback.setCriticite("P3");
            fallback.setSlaHeures(24);
            return fallback;
        }
    }
}
