package com.opticrm.core.chantier.entity;

import com.opticrm.core.account.entity.Account;
import com.opticrm.security.entity.Territory;
import com.opticrm.security.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "chantiers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Chantier {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    // A. Identification
    @Column(name = "nom", nullable = false, length = 255)
    private String nom;

    @Column(name = "ville", length = 100)
    private String ville;

    @Column(name = "prefecture", length = 100)
    private String prefecture;

    @Column(name = "latitude", precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(name = "adresse", length = 500)
    private String adresse;

    // B. Typologie
    // RESIDENTIEL_COLLECTIF | RESIDENTIEL_INDIVIDUEL | TERTIAIRE_INSTITUTIONNEL | COMMERCIAL
    @Column(name = "type_projet", length = 50)
    private String typeProjet;

    // LOGEMENT_SOCIAL | MOYEN_STANDING | HAUT_STANDING | VILLAS | LOTISSEMENT |
    // HOTEL | ECOLE | SANTE | ADMINISTRATION | BUREAUX | CENTRE_COMMERCIAL | RETAIL | MIXTE
    @Column(name = "sous_type_projet", length = 50)
    private String sousTypeProjet;

    // C. Taille
    @Column(name = "nombre_unites")
    private Integer nombreUnites;

    // segment_taille est calculé par PostgreSQL (GENERATED ALWAYS AS STORED) → lecture seule
    @Column(name = "segment_taille", insertable = false, updatable = false, length = 5)
    private String segmentTaille;

    // D. Pipeline
    // ETUDE_CONCEPTION | AUTORISATION | GROS_OEUVRE | SECOND_OEUVRE |
    // PHASE_EQUIPEMENT | LIVRAISON | CLOTURE
    @Column(name = "stade_chantier", length = 30)
    private String stadeChantier;

    @Column(name = "stade_changed_at")
    private Instant stadeChangedAt;

    // E. Acteurs liés (voir ChantierActeur)
    @OneToMany(mappedBy = "chantier", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ChantierActeur> acteurs = new ArrayList<>();

    // F. Niveau d'opportunité (prescription)
    // FERME | PARTIELLEMENT_OUVERT | LIBRE
    @Column(name = "niveau_opportunite", length = 30)
    private String niveauOpportunite;

    // F2. Détails quand niveau = FERME
    @Column(name = "concurrent_ferme", length = 255)
    private String concurrentFerme;

    // Déciseur ayant validé le marché (indépendant du niveau d'opportunité)
    @Column(name = "deciseur", length = 255)
    private String deciseur;

    // G. Suivi commercial
    // ACTIF | PRIORITAIRE | GAGNE | PERDU
    @Column(name = "statut_chantier", length = 20)
    private String statutChantier;

    // H. Témoin (chantier de référence / vitrine commerciale)
    @Column(name = "temoin", nullable = false)
    @Builder.Default
    private Boolean temoin = false;

    // I. Installateur
    @Column(name = "installateur", length = 255)
    private String installateur;

    // J. Promoteur
    @Column(name = "promoteur", length = 255)
    private String promoteur;

    @Column(name = "action_suivante", length = 500)
    private String actionSuivante;

    @Column(name = "date_prochaine_action")
    private LocalDate dateProchaineAction;

    // Relations
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "territory_id")
    private Territory territory;

    // Audit
    @CreatedBy
    @Column(name = "created_by_id", updatable = false)
    private UUID createdById;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    // AI fields
    @Column(name = "health_score")
    private Integer healthScore;

    @Column(name = "conversion_probability", precision = 5, scale = 2)
    private BigDecimal conversionProbability;

    @Column(name = "ai_summary", columnDefinition = "NVARCHAR(MAX)")
    private String aiSummary;

    @Column(name = "last_ai_analysis_at")
    private Instant lastAiAnalysisAt;
}
