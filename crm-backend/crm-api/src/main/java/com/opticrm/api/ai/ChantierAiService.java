package com.opticrm.api.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opticrm.api.ai.dto.*;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.chantier.entity.Chantier;
import com.opticrm.core.chantier.repository.ChantierRepository;
import com.opticrm.core.visit.repository.VisitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChantierAiService {

    private final ChantierRepository chantierRepository;
    private final VisitRepository visitRepository;
    private final AiService aiService;

    private static final String CHANTIER_SYSTEM_PROMPT = """
            Tu es un assistant IA expert en gestion de chantiers de construction au Maroc, intégré dans OptiCRM.
            Tu analyses les chantiers immobiliers (résidentiel collectif, résidentiel individuel, tertiaire, commercial).
            Tu aides les équipes commerciales à :
            - Évaluer la santé et l'avancement des chantiers
            - Prédire les probabilités de conversion commerciale
            - Identifier les risques et opportunités
            - Rédiger des synthèses professionnelles
            - Extraire des informations clés de documents techniques (CCTP, bons de commande, plans)

            Contexte marché : secteur BTP marocain, produits de plomberie/sanitaire/équipement.
            Réponds toujours en français, de manière concise et actionnable.
            """;

    // ─── HEALTH SCORE (rule-based, no AI needed) ────────────────────────────

    @Transactional
    public ChantierHealthResponse computeHealthScore(UUID chantierId) {
        Chantier c = chantierRepository.findById(chantierId)
                .orElseThrow(() -> new ResourceNotFoundException("Chantier", chantierId));

        int scoreVisites = computeVisitScore(c);
        int scorePipeline = computePipelineScore(c);
        int scoreOpportunite = computeOpportuniteScore(c);
        int scoreProfil = computeProfilScore(c);

        int total = scoreVisites + scorePipeline + scoreOpportunite + scoreProfil;

        String label;
        String color;
        String detail;

        if (total >= 85) {
            label = "EXCELLENT"; color = "cyan";
            detail = "Chantier très bien suivi avec un fort potentiel commercial.";
        } else if (total >= 65) {
            label = "BON"; color = "green";
            detail = "Chantier en bonne santé. Quelques points d'amélioration possibles.";
        } else if (total >= 45) {
            label = "ATTENTION"; color = "gold";
            detail = "Chantier nécessitant une attention particulière. Relancez le suivi.";
        } else if (total >= 25) {
            label = "A_RISQUE"; color = "orange";
            detail = "Chantier à risque. Une action corrective est recommandée rapidement.";
        } else {
            label = "CRITIQUE"; color = "red";
            detail = "Chantier en situation critique. Intervention urgente requise.";
        }

        // Persist score
        c.setHealthScore(total);
        c.setLastAiAnalysisAt(Instant.now());
        chantierRepository.save(c);

        return ChantierHealthResponse.builder()
                .score(total)
                .label(label)
                .color(color)
                .detail(detail)
                .scoreVisites(scoreVisites)
                .scorePipeline(scorePipeline)
                .scoreOpportunite(scoreOpportunite)
                .scoreProfil(scoreProfil)
                .build();
    }

    private int computeVisitScore(Chantier c) {
        if (c.getAccount() == null) return 0;

        var visits = visitRepository.findByAccountId(c.getAccount().getId());
        if (visits.isEmpty()) return 0;

        long daysSinceLastVisit = visits.stream()
                .filter(v -> v.getCreatedAt() != null)
                .mapToLong(v -> ChronoUnit.DAYS.between(v.getCreatedAt(), Instant.now()))
                .min()
                .orElse(999);

        if (daysSinceLastVisit <= 7) return 25;
        if (daysSinceLastVisit <= 15) return 20;
        if (daysSinceLastVisit <= 30) return 12;
        if (daysSinceLastVisit <= 60) return 6;
        return 0;
    }

    private int computePipelineScore(Chantier c) {
        if (c.getStadeChantier() == null) return 0;
        return switch (c.getStadeChantier()) {
            case "PHASE_EQUIPEMENT" -> 25;
            case "SECOND_OEUVRE"    -> 22;
            case "GROS_OEUVRE"      -> 18;
            case "AUTORISATION"     -> 12;
            case "LIVRAISON"        -> 10;
            case "ETUDE_CONCEPTION" -> 8;
            case "CLOTURE"          -> 5;
            default -> 0;
        };
    }

    private int computeOpportuniteScore(Chantier c) {
        int score = 0;
        if (c.getNiveauOpportunite() != null) {
            score += switch (c.getNiveauOpportunite()) {
                case "LIBRE"                -> 15;
                case "PARTIELLEMENT_OUVERT" -> 10;
                case "FERME"                -> 3;
                default -> 0;
            };
        }
        if (c.getStatutChantier() != null) {
            score += switch (c.getStatutChantier()) {
                case "PRIORITAIRE" -> 10;
                case "ACTIF"       -> 7;
                case "GAGNE"       -> 5;
                case "PERDU"       -> 0;
                default -> 0;
            };
        }
        return Math.min(score, 25);
    }

    private int computeProfilScore(Chantier c) {
        int score = 0;
        if (c.getNom() != null && !c.getNom().isBlank())               score += 3;
        if (c.getVille() != null && !c.getVille().isBlank())           score += 3;
        if (c.getTypeProjet() != null)                                  score += 3;
        if (c.getNombreUnites() != null && c.getNombreUnites() > 0)    score += 3;
        if (c.getAccount() != null)                                     score += 3;
        if (c.getAssignedTo() != null)                                  score += 3;
        if (c.getLatitude() != null && c.getLongitude() != null)       score += 3;
        if (c.getActionSuivante() != null && !c.getActionSuivante().isBlank()) score += 4;
        return Math.min(score, 25);
    }

    // ─── FULL AI ANALYSIS ────────────────────────────────────────────────────

    @Transactional
    public String analyzeChantier(UUID chantierId) {
        Chantier c = chantierRepository.findById(chantierId)
                .orElseThrow(() -> new ResourceNotFoundException("Chantier", chantierId));

        String prompt = buildChantierContext(c) + """

                Sur la base de ces informations, fournis une analyse commerciale structurée avec :
                1. 📊 **Synthèse** (2-3 phrases sur l'état actuel)
                2. 🎯 **Probabilité de conversion** (estimer en % avec justification)
                3. ⚠️ **Points de vigilance** (2-3 risques identifiés)
                4. ✅ **Actions recommandées** (3 actions prioritaires concrètes)
                5. 🏗️ **Prochain stade attendu** et timing estimé
                """;

        String analysis = aiService.callFast(prompt, CHANTIER_SYSTEM_PROMPT);

        // Persist
        c.setAiSummary(analysis);
        c.setLastAiAnalysisAt(Instant.now());

        // Extract probability from text (simple heuristic)
        extractAndSetProbability(c, analysis);
        chantierRepository.save(c);

        return analysis;
    }

    private void extractAndSetProbability(Chantier c, String analysis) {
        Pattern pattern = Pattern.compile("(\\d{1,3})\\s*%");
        Matcher matcher = pattern.matcher(analysis);
        List<Integer> percentages = new ArrayList<>();
        while (matcher.find()) {
            int val = Integer.parseInt(matcher.group(1));
            if (val >= 0 && val <= 100) percentages.add(val);
        }
        if (!percentages.isEmpty()) {
            c.setConversionProbability(BigDecimal.valueOf(percentages.get(0)));
        }
    }

    // ─── STREAMING CHAT ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SseEmitter streamChantierChat(ChantierChatRequest request) {
        Chantier c = chantierRepository.findById(request.getChantierId())
                .orElseThrow(() -> new ResourceNotFoundException("Chantier", request.getChantierId()));

        String contextualSystemPrompt = CHANTIER_SYSTEM_PROMPT + "\n\n" + buildChantierContext(c);

        ChatRequest chatRequest = new ChatRequest();
        chatRequest.setMessages(request.getMessages());
        return aiService.streamChatWithSystemPrompt(chatRequest, contextualSystemPrompt);
    }

    // ─── DOCUMENT EXTRACTION ─────────────────────────────────────────────────

    public ChantierExtractResponse extractFromDocument(ChantierDocumentExtractRequest request) {
        String prompt = String.format("""
                Analyse ce document de type "%s" et extrais les informations suivantes au format JSON strict.
                Renvoie UNIQUEMENT un objet JSON valide, sans markdown, sans explication.

                Document :
                ---
                %s
                ---

                Format JSON attendu :
                {
                  "nomChantier": "...",
                  "maitrOuvrage": "...",
                  "ville": "...",
                  "typeProjet": "RESIDENTIEL_COLLECTIF|RESIDENTIEL_INDIVIDUEL|TERTIAIRE_INSTITUTIONNEL|COMMERCIAL|null",
                  "stadeChantier": "ETUDE_CONCEPTION|AUTORISATION|GROS_OEUVRE|SECOND_OEUVRE|PHASE_EQUIPEMENT|LIVRAISON|null",
                  "nombreUnites": null,
                  "productsDetected": "produit1, produit2, ...",
                  "delais": "description des délais détectés",
                  "contacts": "nom1 (tel), nom2 (tel)",
                  "rawSummary": "résumé exécutif en 3 phrases"
                }
                """,
                request.getDocumentType() != null ? request.getDocumentType() : "AUTRE",
                request.getDocumentText()
        );

        String raw = aiService.callFast(prompt, CHANTIER_SYSTEM_PROMPT);

        try {
            ObjectMapper mapper = new ObjectMapper();
            String cleaned = raw.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();
            return mapper.readValue(cleaned, ChantierExtractResponse.class);
        } catch (Exception e) {
            log.warn("Could not parse AI JSON response for document extraction: {}", e.getMessage());
            ChantierExtractResponse fallback = new ChantierExtractResponse();
            fallback.setRawSummary(raw);
            return fallback;
        }
    }

    // ─── IMAGE EXTRACTION ────────────────────────────────────────────────────

    /**
     * Analyse une photo de chantier (panneau de chantier, façade, billboard...)
     * et en extrait les informations structurées.
     */
    public ChantierExtractResponse extractFromImage(org.springframework.web.multipart.MultipartFile file) {
        try {
            // Convert to base64
            byte[] bytes = file.getBytes();
            String base64Data = java.util.Base64.getEncoder().encodeToString(bytes);

            // Detect media type
            String contentType = file.getContentType();
            if (contentType == null) contentType = "image/jpeg";

            String prompt = """
                    Analyse cette image d'un chantier de construction au Maroc (panneau de chantier, billboard publicitaire, façade, etc.).

                    Extrais toutes les informations visibles et renvoie UNIQUEMENT un objet JSON valide, sans markdown, sans explication.

                    Format JSON attendu :
                    {
                      "nomChantier": "nom du projet/résidence visible sur l'image",
                      "maitrOuvrage": "nom du promoteur/maître d'ouvrage si visible",
                      "ville": "ville si détectable (indice : préfixe téléphonique marocain - 0522=Casablanca, 0537=Rabat, 0528=Agadir, 0535=Fès, 0536=Oujda, 0524=Marrakech)",
                      "typeProjet": "RESIDENTIEL_COLLECTIF|RESIDENTIEL_INDIVIDUEL|TERTIAIRE_INSTITUTIONNEL|COMMERCIAL|null",
                      "sousTypeProjet": "LOGEMENT_SOCIAL|MOYEN_STANDING|HAUT_STANDING|VILLAS|HOTEL|BUREAUX|CENTRE_COMMERCIAL|null",
                      "stadeChantier": "ETUDE_CONCEPTION|AUTORISATION|GROS_OEUVRE|SECOND_OEUVRE|PHASE_EQUIPEMENT|LIVRAISON|null",
                      "nombreUnites": null,
                      "productsDetected": "produits ou équipements mentionnés",
                      "delais": "délais ou dates visibles (ex: livraison prévue...)",
                      "contacts": "téléphone, email, site web visibles",
                      "rawSummary": "description en 2-3 phrases de ce que montre l'image"
                    }

                    Si une information n'est pas visible, mets null.
                    Pour le téléphone 0537 → Rabat/Salé, 0522/0523 → Casablanca, 0528 → Agadir, 0535 → Fès, 0524 → Marrakech.
                    """;

            String raw = aiService.callWithImage(base64Data, contentType, prompt, CHANTIER_SYSTEM_PROMPT);

            // Parse JSON response
            try {
                String cleaned = raw.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();
                return new com.fasterxml.jackson.databind.ObjectMapper().readValue(cleaned, ChantierExtractResponse.class);
            } catch (Exception e) {
                log.warn("Could not parse vision AI JSON: {}", e.getMessage());
                ChantierExtractResponse fallback = new ChantierExtractResponse();
                fallback.setRawSummary(raw);
                return fallback;
            }
        } catch (Exception e) {
            log.error("Image extraction failed", e);
            ChantierExtractResponse err = new ChantierExtractResponse();
            err.setRawSummary("⚠️ Erreur lors de l'analyse de l'image : " + e.getMessage());
            return err;
        }
    }

    // ─── GEO INSIGHTS ────────────────────────────────────────────────────────

    public String generateGeoInsights() {
        List<Chantier> chantiers = chantierRepository.findAllWithGps();
        if (chantiers.isEmpty()) return "Aucun chantier géolocalisé disponible pour l'analyse.";

        StringBuilder sb = new StringBuilder();
        sb.append("Voici la liste des chantiers géolocalisés actifs :\n\n");
        for (Chantier c : chantiers) {
            sb.append(String.format("- %s | %s | Lat: %s, Lon: %s | Stade: %s | Statut: %s\n",
                    c.getNom(),
                    c.getVille() != null ? c.getVille() : "?",
                    c.getLatitude(),
                    c.getLongitude(),
                    c.getStadeChantier() != null ? c.getStadeChantier() : "?",
                    c.getStatutChantier() != null ? c.getStatutChantier() : "?"
            ));
        }
        sb.append("""

                Analyse ces chantiers et fournis :
                1. 🗺️ **Clusters géographiques** (regroupe par zone : ville/région)
                2. 📍 **Tournées optimisées** suggérées (3 tournées max avec chantiers à visiter ensemble)
                3. 🔥 **Zones à fort potentiel** non suffisamment couvertes
                4. 📊 **Statistiques** par ville/région
                """);

        return aiService.callFast(sb.toString(), CHANTIER_SYSTEM_PROMPT);
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────

    private String buildChantierContext(Chantier c) {
        return String.format("""
                === FICHE CHANTIER ===
                Nom : %s
                Localisation : %s%s
                Type de projet : %s%s
                Nombre d'unités : %s (Segment : %s)
                Stade chantier : %s
                Niveau d'opportunité : %s%s
                Statut commercial : %s
                Compte client : %s
                Commercial assigné : %s
                Action suivante : %s
                Date prochaine action : %s
                Témoin/Référence : %s
                Installateur : %s
                Promoteur : %s
                Créé le : %s
                """,
                c.getNom(),
                c.getVille() != null ? c.getVille() : "Non renseigné",
                c.getPrefecture() != null ? ", " + c.getPrefecture() : "",
                c.getTypeProjet() != null ? c.getTypeProjet() : "Non renseigné",
                c.getSousTypeProjet() != null ? " / " + c.getSousTypeProjet() : "",
                c.getNombreUnites() != null ? c.getNombreUnites() : "?",
                c.getSegmentTaille() != null ? c.getSegmentTaille() : "?",
                c.getStadeChantier() != null ? c.getStadeChantier() : "Non renseigné",
                c.getNiveauOpportunite() != null ? c.getNiveauOpportunite() : "Non renseigné",
                c.getConcurrentFerme() != null ? " (concurrent: " + c.getConcurrentFerme() + ")" : "",
                c.getStatutChantier() != null ? c.getStatutChantier() : "Non renseigné",
                c.getAccount() != null ? c.getAccount().getName() : "Non lié",
                c.getAssignedTo() != null ? c.getAssignedTo().getFullName() : "Non assigné",
                c.getActionSuivante() != null ? c.getActionSuivante() : "Non définie",
                c.getDateProchaineAction() != null ? c.getDateProchaineAction().toString() : "Non définie",
                Boolean.TRUE.equals(c.getTemoin()) ? "Oui" : "Non",
                c.getInstallateur() != null ? c.getInstallateur() : "Non renseigné",
                c.getPromoteur() != null ? c.getPromoteur() : "Non renseigné",
                c.getCreatedAt() != null ? c.getCreatedAt().toString() : "?"
        );
    }
}
