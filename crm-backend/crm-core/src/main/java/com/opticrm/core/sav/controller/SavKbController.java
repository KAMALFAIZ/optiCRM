package com.opticrm.core.sav.controller;

import com.opticrm.core.sav.entity.KbArticle;
import com.opticrm.core.sav.repository.KbArticleRepository;
import com.opticrm.core.sav.service.EmbeddingService;
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

/**
 * Gestion Knowledge Base — KASOFT team uniquement.
 * URL : /api/v1/sav/kb/...
 */
@RestController
@RequestMapping("/api/v1/sav/kb")
@RequiredArgsConstructor
@Tag(name = "SAV Knowledge Base", description = "Gestion KB KASOFT — KASOFT uniquement")
@PreAuthorize("hasRole('ADMIN') or hasRole('KASOFT_TEAM')")
public class SavKbController {

    private final KbArticleRepository kbArticleRepository;
    private final EmbeddingService embeddingService;

    @GetMapping
    @Operation(summary = "Liste tous les articles KB")
    public ResponseEntity<List<KbArticle>> listArticles(
            @RequestParam(required = false) String categorie,
            @RequestParam(defaultValue = "false") boolean actifSeulement) {

        List<KbArticle> articles;
        if (categorie != null) {
            articles = actifSeulement
                    ? kbArticleRepository.findActiveByCategorie(categorie)
                    : kbArticleRepository.findByCategorieAndActifTrueAndValideParKamalTrue(categorie);
        } else {
            articles = actifSeulement
                    ? kbArticleRepository.findByActifTrue()
                    : kbArticleRepository.findAll();
        }
        return ResponseEntity.ok(articles);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'un article KB")
    public ResponseEntity<KbArticle> getArticle(@PathVariable UUID id) {
        return kbArticleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Créer un article KB")
    public ResponseEntity<KbArticle> createArticle(@RequestBody KbArticle article) {
        KbArticle saved = kbArticleRepository.save(article);
        // Générer les embeddings en background
        try {
            embeddingService.regenerateArticleEmbeddings(saved);
        } catch (Exception e) {
            // Ne pas bloquer la création si embedding échoue
        }
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier un article KB")
    public ResponseEntity<KbArticle> updateArticle(@PathVariable UUID id, @RequestBody KbArticle updates) {
        KbArticle article = kbArticleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Article non trouvé"));

        article.setTitreFr(updates.getTitreFr());
        article.setTitreAr(updates.getTitreAr());
        article.setSymptomesFr(updates.getSymptomesFr());
        article.setCausesFr(updates.getCausesFr());
        article.setSolutionExpertFr(updates.getSolutionExpertFr());
        article.setSolutionInterFr(updates.getSolutionInterFr());
        article.setSolutionDebutFr(updates.getSolutionDebutFr());
        article.setSolutionExpertAr(updates.getSolutionExpertAr());
        article.setSolutionInterAr(updates.getSolutionInterAr());
        article.setSolutionDebutAr(updates.getSolutionDebutAr());
        article.setTags(updates.getTags());
        article.setMotsClesFr(updates.getMotsClesFr());
        article.setCriticiteDefaut(updates.getCriticiteDefaut());
        article.setNiveauDifficulte(updates.getNiveauDifficulte());
        article.setActif(updates.getActif());
        article.setValideParKamal(false); // nécessite re-validation après modification

        KbArticle saved = kbArticleRepository.save(article);

        // Régénérer les embeddings
        try {
            embeddingService.regenerateArticleEmbeddings(saved);
        } catch (Exception e) {
            // non-bloquant
        }

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/valider")
    @Operation(summary = "Valider un article pour la production")
    public ResponseEntity<KbArticle> validerArticle(@PathVariable UUID id) {
        KbArticle article = kbArticleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Article non trouvé"));
        article.setValideParKamal(true);
        article.setDateValidation(Instant.now());
        return ResponseEntity.ok(kbArticleRepository.save(article));
    }

    @PostMapping("/{id}/regenerer-embedding")
    @Operation(summary = "Régénérer l'embedding d'un article")
    public ResponseEntity<Map<String, String>> regenererEmbedding(@PathVariable UUID id) {
        KbArticle article = kbArticleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Article non trouvé"));
        embeddingService.regenerateArticleEmbeddings(article);
        return ResponseEntity.ok(Map.of("status", "Embedding régénéré pour " + article.getCodeArticle()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Désactiver un article KB (soft delete)")
    public ResponseEntity<Void> deactivateArticle(@PathVariable UUID id) {
        kbArticleRepository.findById(id).ifPresent(a -> {
            a.setActif(false);
            kbArticleRepository.save(a);
        });
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    @Operation(summary = "Rechercher dans la KB par mot-clé")
    public ResponseEntity<List<KbArticle>> search(@RequestParam String q) {
        return ResponseEntity.ok(kbArticleRepository.searchByMotCle(q));
    }
}
