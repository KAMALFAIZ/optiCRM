package com.opticrm.core.sav.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTOs pour les réponses JSON des agents IA.
 */
public class AgentResult {

    // ── Agent 1 — Réceptionniste ─────────────────────────────────────────
    @Data @NoArgsConstructor @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Agent1Result {
        @JsonProperty("langue_detectee")
        private String langueDetectee;

        @JsonProperty("probleme_extrait")
        private String problemeExtrait;

        @JsonProperty("informations_cles")
        private List<String> informationsCles;

        @JsonProperty("message_accuse_reception_fr")
        private String messageAccuseReceptionFr;

        @JsonProperty("message_accuse_reception_ar")
        private String messageAccuseReceptionAr;

        @JsonProperty("necessite_clarification")
        private Boolean necessiteClarification;

        @JsonProperty("question_clarification_fr")
        private String questionClarificationFr;

        @JsonProperty("question_clarification_ar")
        private String questionClarificationAr;
    }

    // ── Agent 2 — Classificateur ─────────────────────────────────────────
    @Data @NoArgsConstructor @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Agent2Result {
        @JsonProperty("domaine")
        private String domaine;

        @JsonProperty("type_ticket")
        private String typeTicket;

        @JsonProperty("criticite")
        private String criticite;

        @JsonProperty("sla_heures")
        private Integer slaHeures;

        @JsonProperty("justification_criticite")
        private String justificationCriticite;

        @JsonProperty("mots_cles_recherche")
        private List<String> motsClesRecherche;
    }

    // ── Agent 3 — Spécialiste ─────────────────────────────────────────────
    @Data @NoArgsConstructor @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Agent3Result {
        @JsonProperty("sous_categorie")
        private String sousCategorie;

        @JsonProperty("hypotheses_causes")
        private List<String> hypothesesCauses;

        @JsonProperty("informations_manquantes")
        private List<String> informationsManquantes;

        @JsonProperty("necessite_acces_sql")
        private Boolean necessite_acces_sql;

        @JsonProperty("necessite_acces_distant")
        private Boolean necessiteAccesDistant;

        @JsonProperty("niveau_urgence_confirme")
        private String niveauUrgenceConfirme;

        @JsonProperty("tags_kb")
        private List<String> tagsKb;
    }

    // ── Agent 4 — Diagnostiqueur ─────────────────────────────────────────
    @Data @NoArgsConstructor
    public static class Agent4Result {
        private String action;          // RESOLUTION_DIRECTE / RESOLUTION_AVEC_CONFIRMATION / ESCALADE
        private KbSearchResult articlePrincipal;
        private List<KbSearchResult> top3Articles;
        private Double scoreConfiance;
        private String raisonEscalade;
    }

    @Data @NoArgsConstructor
    public static class KbSearchResult {
        private String articleId;
        private String codeArticle;
        private String titreFr;
        private Double score;
        private String categorie;
        private String sousCategorie;
    }

    // ── Agent 5A — Resolver ───────────────────────────────────────────────
    @Data @NoArgsConstructor @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Agent5ResolverResult {
        private String solutionFormattee;
        private String langue;
        private String niveau;
        private boolean proposerRdv;
    }

    // ── Pipeline input ────────────────────────────────────────────────────
    @Data @NoArgsConstructor
    public static class TicketInput {
        private String texteClient;
        private String accountId;
        private String canal;
        private String telWhatsapp;
    }
}
