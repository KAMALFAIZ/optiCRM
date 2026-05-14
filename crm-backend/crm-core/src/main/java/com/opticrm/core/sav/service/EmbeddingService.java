package com.opticrm.core.sav.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opticrm.core.sav.config.SavProperties;
import com.opticrm.core.sav.dto.AgentResult;
import com.opticrm.core.sav.entity.KbArticle;
import com.opticrm.core.sav.entity.KbEmbedding;
import com.opticrm.core.sav.repository.KbEmbeddingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmbeddingService {

    private final KbEmbeddingRepository embeddingRepository;
    private final SavProperties savProperties;
    private final ObjectMapper objectMapper;

    private static final String OPENAI_EMBEDDING_URL = "https://api.openai.com/v1/embeddings";

    /**
     * Génère un embedding vectoriel float[1536] via OpenAI text-embedding-3-small.
     */
    public double[] generateEmbedding(String texte) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(savProperties.getOpenai().getApiKey());

            Map<String, Object> body = Map.of(
                    "model", savProperties.getEmbedding().getModel(),
                    "input", texte
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(OPENAI_EMBEDDING_URL, request, Map.class);

            if (response != null && response.containsKey("data")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
                if (!data.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    List<Number> embeddingList = (List<Number>) data.get(0).get("embedding");
                    return embeddingList.stream().mapToDouble(Number::doubleValue).toArray();
                }
            }
        } catch (Exception e) {
            log.error("Erreur génération embedding: {}", e.getMessage());
        }
        return new double[0];
    }

    /**
     * Calcul cosinus entre deux vecteurs.
     */
    public double cosineSimilarity(double[] v1, double[] v2) {
        if (v1.length == 0 || v2.length != v1.length) return 0.0;
        double dot = 0, norm1 = 0, norm2 = 0;
        for (int i = 0; i < v1.length; i++) {
            dot += v1[i] * v2[i];
            norm1 += v1[i] * v1[i];
            norm2 += v2[i] * v2[i];
        }
        if (norm1 == 0 || norm2 == 0) return 0.0;
        return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    /**
     * Recherche KB par similarité cosinus.
     * Charge les embeddings du domaine, calcule la similarité, retourne les top-k.
     */
    public List<AgentResult.KbSearchResult> searchKb(double[] queryEmbedding,
                                                       String domaine, String langue, int topK) {
        List<KbEmbedding> candidates = embeddingRepository.findForSearch(domaine, langue);
        if (candidates.isEmpty()) {
            candidates = embeddingRepository.findAllActiveByLangue(langue);
        }

        List<AgentResult.KbSearchResult> results = new ArrayList<>();
        for (KbEmbedding emb : candidates) {
            try {
                double[] vec = parseVector(emb.getVecteurJson());
                double score = cosineSimilarity(queryEmbedding, vec);

                AgentResult.KbSearchResult r = new AgentResult.KbSearchResult();
                r.setArticleId(emb.getArticle().getId().toString());
                r.setCodeArticle(emb.getArticle().getCodeArticle());
                r.setTitreFr(emb.getArticle().getTitreFr());
                r.setScore(score);
                r.setCategorie(emb.getArticle().getCategorie());
                r.setSousCategorie(emb.getArticle().getSousCategorie());
                results.add(r);
            } catch (Exception e) {
                log.warn("Erreur lecture embedding {}: {}", emb.getId(), e.getMessage());
            }
        }

        results.sort(Comparator.comparingDouble(AgentResult.KbSearchResult::getScore).reversed());
        return results.subList(0, Math.min(topK, results.size()));
    }

    /**
     * Génère et sauvegarde les embeddings d'un article (FR + AR).
     */
    @Transactional
    public void regenerateArticleEmbeddings(KbArticle article) {
        embeddingRepository.deleteByArticleId(article.getId());

        generateAndSave(article, buildSearchText(article, "FR"), "FR");
        if (article.getTitreAr() != null && !article.getTitreAr().isBlank()) {
            generateAndSave(article, buildSearchText(article, "AR"), "AR");
        }
        log.info("Embeddings régénérés pour article {}", article.getCodeArticle());
    }

    private void generateAndSave(KbArticle article, String texte, String langue) {
        double[] vector = generateEmbedding(texte);
        if (vector.length == 0) return;

        KbEmbedding emb = KbEmbedding.builder()
                .article(article)
                .chunkIndex(0)
                .chunkTexte(texte)
                .langue(langue)
                .vecteurJson(Arrays.toString(vector))
                .modeleEmbedding(savProperties.getEmbedding().getModel())
                .build();
        embeddingRepository.save(emb);
    }

    private String buildSearchText(KbArticle article, String langue) {
        if ("AR".equals(langue)) {
            return String.join(" ",
                    notNull(article.getTitreAr()),
                    notNull(article.getSymptomesAr()),
                    notNull(article.getCausesAr()));
        }
        return String.join(" ",
                notNull(article.getTitreFr()),
                notNull(article.getSymptomesFr()),
                notNull(article.getCausesFr()),
                notNull(article.getMotsClesFr()),
                notNull(article.getTags()));
    }

    private String notNull(String s) { return s != null ? s : ""; }

    private double[] parseVector(String json) throws Exception {
        List<Double> list = objectMapper.readValue(json, new TypeReference<>() {});
        return list.stream().mapToDouble(Double::doubleValue).toArray();
    }
}
