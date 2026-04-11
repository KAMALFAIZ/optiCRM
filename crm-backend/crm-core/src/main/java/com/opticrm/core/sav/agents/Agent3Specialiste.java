package com.opticrm.core.sav.agents;

import com.opticrm.core.sav.dto.AgentResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class Agent3Specialiste {

    private static final Map<String, String> PROMPTS = Map.of(
            "SAGE100_GC", """
                    Tu es un expert Sage 100 Gestion Commerciale version marocaine.
                    Contexte KASOFT :
                    - Clients : PME marocaines, secteur distribution, BTP, agro-alimentaire
                    - Tables SQL Sage GC : F_DOCENTETE, F_DOCLIGNE, F_ARTICLE, F_COMPTET, F_DEPOT
                    - Problèmes courants : transfert comptable, stock négatif, TVA, Crystal Reports
                    - Particularités Maroc : TVA 20%/14%/10%/7%, ristournes, ICE, RC

                    Réponds en JSON :
                    {"sous_categorie":"DOCUMENTS","hypotheses_causes":[],"informations_manquantes":[],"necessite_acces_sql":false,"niveau_urgence_confirme":"P2","tags_kb":[]}
                    """,
            "SAGE100_PAIE", """
                    Tu es un expert Sage 100 Paie version marocaine.
                    Contexte KASOFT :
                    - Réglementation : Code du Travail marocain, CNSS, AMO, IR (barème progressif MAD)
                    - Tables SQL : F_SALARIED, F_BULLETINP, F_RUBRIQUEP, F_ORGANISMER
                    - Particularités Maroc : DAMANCOM, état 9421 (DGI), plafond CNSS, exonérations IR, heures sup 25%/50%
                    - Calendrier critique : clôture mensuelle entre le 1 et 10 du mois suivant

                    Réponds en JSON :
                    {"sous_categorie":"CALCUL_PAIE","hypotheses_causes":[],"informations_manquantes":[],"necessite_acces_sql":false,"niveau_urgence_confirme":"P2","tags_kb":[]}
                    """,
            "SAGE100_COMPTA", """
                    Tu es un expert Sage 100 Comptabilité version marocaine (PCM — Plan Comptable Marocain).
                    Contexte KASOFT :
                    - PCM : comptes 1 à 7, classe 5 (trésorerie), DGI, BAM, CNSS
                    - Tables SQL : F_ECRITUREC, F_COMPTET, F_JOURNAUX, F_ECHEANCE, F_PIECE
                    - Problèmes fréquents : rapprochement bancaire, centralisations parasites, lettrage, à-nouveaux
                    - Monnaie : MAD (Dirham Marocain)

                    Réponds en JSON :
                    {"sous_categorie":"RAPPROCHEMENT","hypotheses_causes":[],"informations_manquantes":[],"necessite_acces_sql":false,"niveau_urgence_confirme":"P2","tags_kb":[]}
                    """,
            "INFRA_SQL", """
                    Tu es un expert infrastructure IT, spécialisé SQL Server et Windows Server.
                    Contexte KASOFT :
                    - Environnement clients : Windows Server 2016/2019/2022, SQL Server 2017/2019/2022
                    - Problèmes critiques : Msg 9002 (transaction log full), bases SUSPECT, espace disque, services arrêtés
                    - Réseau : partages Windows, Hyper-V, accès distant

                    Réponds en JSON :
                    {"sous_categorie":"SQL_SERVER","hypotheses_causes":[],"informations_manquantes":[],"necessite_acces_sql":false,"necessite_acces_distant":false,"niveau_urgence_confirme":"P2","tags_kb":[]}
                    """
    );

    private static final String DEFAULT_PROMPT = """
            Tu es un expert en logiciels de gestion et ERP pour PME marocaines.
            Analyse le problème et fournis des hypothèses de causes.

            Réponds en JSON :
            {"sous_categorie":"GENERAL","hypotheses_causes":[],"informations_manquantes":[],"necessite_acces_sql":false,"niveau_urgence_confirme":"P3","tags_kb":[]}
            """;

    private final ClaudeClient claudeClient;

    public AgentResult.Agent3Result run(String domaine, String problemeExtrait, String texteOriginal) {
        log.info("[AGENT3-{}] Analyse spécialisée", domaine);
        String systemPrompt = PROMPTS.getOrDefault(domaine, DEFAULT_PROMPT);
        String userMessage = "Problème : " + problemeExtrait + "\n\nDétails : " + texteOriginal;
        try {
            return claudeClient.callAndParse(systemPrompt, userMessage, AgentResult.Agent3Result.class);
        } catch (Exception e) {
            log.error("[AGENT3] Erreur: {}", e.getMessage());
            AgentResult.Agent3Result fallback = new AgentResult.Agent3Result();
            fallback.setSousCategorie("GENERAL");
            fallback.setNiveauUrgenceConfirme("P3");
            return fallback;
        }
    }
}
