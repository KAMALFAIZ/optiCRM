package com.opticrm.core.sav.agents;

import com.opticrm.core.sav.dto.AgentResult;
import com.opticrm.core.sav.entity.KbArticle;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class Agent5Resolver {

    private final ClaudeClient claudeClient;

    private String buildSystemPrompt(String niveau, String langue) {
        String lang = "AR".equals(langue) ? "arabe classique" : "français";
        return switch (niveau) {
            case "EXPERT" -> String.format("""
                    Tu es l'assistant technique KASOFT. Tu t'adresses à un expert IT ou comptable confirmé.
                    Réponds en %s.
                    Style : Direct, technique, concis. Tu peux utiliser du jargon technique, des noms de tables SQL,
                    des chemins de menu Sage précis. Pas d'explications de base.
                    Format : Étapes numérotées courtes, maximum 5 étapes.
                    Termine par : "Si le problème persiste, répondez NON et je transmets à notre équipe."
                    """, lang);
            case "DEBUTANT" -> String.format("""
                    Tu es l'assistant technique KASOFT. Tu t'adresses à un utilisateur non technique.
                    Réponds en %s.
                    Style : Simple, rassurant, très guidé. Aucun jargon technique.
                    Format : Étapes très détaillées.
                    Si la solution est trop technique : proposer directement un RDV Teams.
                    Commence par : "Pas d'inquiétude, nous allons résoudre cela ensemble."
                    """, lang);
            default -> String.format("""
                    Tu es l'assistant technique KASOFT. Tu t'adresses à un utilisateur de niveau intermédiaire.
                    Réponds en %s.
                    Style : Clair, structuré, avec quelques explications. Évite le jargon SQL brut.
                    Format : Étapes numérotées détaillées avec le chemin de menu exact.
                    Termine par : "Si vous n'y arrivez pas, répondez NON et nous vous aiderons."
                    """, lang);
        };
    }

    public AgentResult.Agent5ResolverResult run(KbArticle article, String niveau, String langue) {
        log.info("[AGENT5-RESOLVER] Formatage solution pour niveau={} langue={}", niveau, langue);

        String solution = getSolutionFromArticle(article, niveau, langue);

        String systemPrompt = buildSystemPrompt(niveau, langue);
        String userMessage = "Voici la solution technique à reformuler et adapter pour le client :\n\n" + solution;

        AgentResult.Agent5ResolverResult result = new AgentResult.Agent5ResolverResult();
        try {
            String formatted = claudeClient.call(systemPrompt, userMessage);
            result.setSolutionFormattee(formatted);
            result.setLangue(langue);
            result.setNiveau(niveau);
            result.setProposerRdv(Boolean.TRUE.equals(article.getNecessite_rdv()));
        } catch (Exception e) {
            log.error("[AGENT5-RESOLVER] Erreur: {}", e.getMessage());
            result.setSolutionFormattee(solution);
            result.setLangue(langue);
            result.setNiveau(niveau);
        }
        return result;
    }

    private String getSolutionFromArticle(KbArticle article, String niveau, String langue) {
        boolean isAr = "AR".equals(langue);
        return switch (niveau) {
            case "EXPERT"    -> isAr ? nvl(article.getSolutionExpertAr(), article.getSolutionExpertFr())
                                     : nvl(article.getSolutionExpertFr(), article.getSolutionInterFr());
            case "DEBUTANT"  -> isAr ? nvl(article.getSolutionDebutAr(), article.getSolutionDebutFr())
                                     : nvl(article.getSolutionDebutFr(), article.getSolutionInterFr());
            default          -> isAr ? nvl(article.getSolutionInterAr(), article.getSolutionInterFr())
                                     : nvl(article.getSolutionInterFr(), article.getSolutionExpertFr());
        };
    }

    private String nvl(String a, String b) { return a != null && !a.isBlank() ? a : b; }
}
