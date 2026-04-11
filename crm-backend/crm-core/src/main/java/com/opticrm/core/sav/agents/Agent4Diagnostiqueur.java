package com.opticrm.core.sav.agents;

import com.opticrm.core.sav.config.SavProperties;
import com.opticrm.core.sav.dto.AgentResult;
import com.opticrm.core.sav.service.EmbeddingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class Agent4Diagnostiqueur {

    private final EmbeddingService embeddingService;
    private final SavProperties savProperties;

    /**
     * Seuils de décision par criticité.
     */
    private double getSeuil(String criticite) {
        return switch (criticite) {
            case "P1" -> savProperties.getEmbedding().getSeuilP1();
            case "P2" -> savProperties.getEmbedding().getSeuilP2();
            default  -> savProperties.getEmbedding().getSeuilP3();
        };
    }

    public AgentResult.Agent4Result run(AgentResult.Agent1Result r1,
                                        AgentResult.Agent2Result r2,
                                        AgentResult.Agent3Result r3) {
        log.info("[AGENT4] Recherche KB pour domaine={}", r2.getDomaine());

        // Construire le texte de recherche
        List<String> parts = new ArrayList<>();
        if (r1.getProblemeExtrait() != null) parts.add(r1.getProblemeExtrait());
        if (r2.getMotsClesRecherche() != null) parts.addAll(r2.getMotsClesRecherche());
        if (r3.getTagsKb() != null) parts.addAll(r3.getTagsKb());
        String queryText = String.join(" ", parts);

        String langue = "AR".equals(r1.getLangueDetectee()) ? "AR" : "FR";

        AgentResult.Agent4Result result = new AgentResult.Agent4Result();

        try {
            double[] embedding = embeddingService.generateEmbedding(queryText);
            if (embedding.length == 0) {
                return buildEscaladeResult(result, r2.getCriticite(), "Embedding non disponible (clé API manquante)");
            }

            List<AgentResult.KbSearchResult> top5 = embeddingService.searchKb(
                    embedding, r2.getDomaine(), langue, 5);

            if (top5.isEmpty()) {
                return buildEscaladeResult(result, r2.getCriticite(), "Aucun article KB trouvé pour ce domaine");
            }

            AgentResult.KbSearchResult best = top5.get(0);
            double scoreConfiance = calculateScore(best, r2, r3);
            double seuil = getSeuil(r2.getCriticite());

            result.setScoreConfiance(scoreConfiance);
            result.setArticlePrincipal(best);
            result.setTop3Articles(top5.subList(0, Math.min(3, top5.size())));

            if (scoreConfiance >= 0.90) {
                result.setAction("RESOLUTION_DIRECTE");
            } else if (scoreConfiance >= seuil) {
                result.setAction("RESOLUTION_AVEC_CONFIRMATION");
            } else {
                result.setAction("ESCALADE");
                result.setRaisonEscalade(String.format(
                        "Score KB %.0f%% inférieur au seuil %.0f%% pour criticité %s",
                        scoreConfiance * 100, seuil * 100, r2.getCriticite()));
            }
        } catch (Exception e) {
            log.error("[AGENT4] Erreur recherche KB: {}", e.getMessage());
            return buildEscaladeResult(result, r2.getCriticite(), "Erreur recherche KB: " + e.getMessage());
        }

        return result;
    }

    /**
     * Score composite : cosinus (60%) + domaine (20%) + tags (20%).
     */
    private double calculateScore(AgentResult.KbSearchResult best,
                                   AgentResult.Agent2Result r2,
                                   AgentResult.Agent3Result r3) {
        double scoreBase = best.getScore();
        double scoreDomaine = r2.getDomaine().equals(best.getCategorie()) ? 1.0 : 0.5;
        double scoreTags = 0.5;
        if (r3.getTagsKb() != null && best.getSousCategorie() != null) {
            boolean tagMatch = r3.getTagsKb().stream()
                    .anyMatch(t -> best.getSousCategorie().toLowerCase().contains(t.toLowerCase()));
            scoreTags = tagMatch ? 1.0 : 0.3;
        }
        return scoreBase * 0.6 + scoreDomaine * 0.2 + scoreTags * 0.2;
    }

    private AgentResult.Agent4Result buildEscaladeResult(AgentResult.Agent4Result result,
                                                          String criticite, String raison) {
        result.setAction("ESCALADE");
        result.setScoreConfiance(0.0);
        result.setRaisonEscalade(raison);
        result.setTop3Articles(List.of());
        return result;
    }
}
