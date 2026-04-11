package com.opticrm.core.sav.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "kb_embeddings")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class KbEmbedding {

    @Id @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_article", nullable = false)
    private KbArticle article;

    @Column(name = "chunk_index")
    @Builder.Default
    private Integer chunkIndex = 0;

    @Column(name = "chunk_texte", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String chunkTexte;

    @Column(name = "langue", length = 5)
    @Builder.Default
    private String langue = "FR";

    @Column(name = "vecteur_json", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String vecteurJson;

    @Column(name = "modele_embedding", length = 100)
    private String modeleEmbedding;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
