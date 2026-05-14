package com.opticrm.core.sav.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "kb_articles")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class KbArticle {

    @Id @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "code_article", nullable = false, unique = true, length = 20)
    private String codeArticle;

    @Column(name = "categorie", nullable = false, length = 30)
    private String categorie;

    @Column(name = "sous_categorie", length = 50)
    private String sousCategorie;

    @Column(name = "titre_fr", nullable = false, length = 300)
    private String titreFr;

    @Column(name = "titre_ar", length = 300)
    private String titreAr;

    @Column(name = "symptomes_fr", columnDefinition = "NVARCHAR(MAX)")
    private String symptomesFr;

    @Column(name = "symptomes_ar", columnDefinition = "NVARCHAR(MAX)")
    private String symptomesAr;

    @Column(name = "causes_fr", columnDefinition = "NVARCHAR(MAX)")
    private String causesFr;

    @Column(name = "causes_ar", columnDefinition = "NVARCHAR(MAX)")
    private String causesAr;

    @Column(name = "solution_expert_fr", columnDefinition = "NVARCHAR(MAX)")
    private String solutionExpertFr;

    @Column(name = "solution_expert_ar", columnDefinition = "NVARCHAR(MAX)")
    private String solutionExpertAr;

    @Column(name = "solution_inter_fr", columnDefinition = "NVARCHAR(MAX)")
    private String solutionInterFr;

    @Column(name = "solution_inter_ar", columnDefinition = "NVARCHAR(MAX)")
    private String solutionInterAr;

    @Column(name = "solution_debut_fr", columnDefinition = "NVARCHAR(MAX)")
    private String solutionDebutFr;

    @Column(name = "solution_debut_ar", columnDefinition = "NVARCHAR(MAX)")
    private String solutionDebutAr;

    @Column(name = "prerequis_fr", columnDefinition = "NVARCHAR(MAX)")
    private String prerequisFr;

    @Column(name = "prerequis_ar", columnDefinition = "NVARCHAR(MAX)")
    private String prerequisAr;

    @Column(name = "tags", length = 500)
    private String tags;

    @Column(name = "mots_cles_fr", columnDefinition = "NVARCHAR(MAX)")
    private String motsClesFr;

    @Column(name = "mots_cles_ar", columnDefinition = "NVARCHAR(MAX)")
    private String motsClesAr;

    @Column(name = "criticite_defaut", length = 5)
    @Builder.Default
    private String criticiteDefaut = "P2";

    @Column(name = "niveau_difficulte", length = 20)
    @Builder.Default
    private String niveauDifficulte = "INTERMEDIAIRE";

    @Column(name = "necessite_acces_sql")
    @Builder.Default
    private Boolean necessite_acces_sql = false;

    @Column(name = "necessite_rdv")
    @Builder.Default
    private Boolean necessite_rdv = false;

    @Column(name = "nb_utilisations")
    @Builder.Default
    private Integer nbUtilisations = 0;

    @Column(name = "nb_succes")
    @Builder.Default
    private Integer nbSucces = 0;

    @Column(name = "source", length = 20)
    @Builder.Default
    private String source = "MANUEL";

    @Column(name = "id_ticket_source")
    private UUID idTicketSource;

    @Column(name = "actif")
    @Builder.Default
    private Boolean actif = true;

    @Column(name = "valide_par_kamal")
    @Builder.Default
    private Boolean valideParKamal = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "date_validation")
    private Instant dateValidation;

    /** Taux succès calculé (évite la colonne computée SQL Server) */
    public Double getTauxSucces() {
        if (nbUtilisations == null || nbUtilisations == 0) return null;
        return (double) nbSucces / nbUtilisations;
    }
}
