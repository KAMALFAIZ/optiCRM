package com.opticrm.core.chantier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateChantierRequest {

    @NotBlank(message = "Le nom du chantier est obligatoire")
    @Size(max = 255)
    private String nom;

    @Size(max = 100)
    private String ville;

    @Size(max = 100)
    private String prefecture;

    private BigDecimal latitude;
    private BigDecimal longitude;

    @Size(max = 500)
    private String adresse;

    // RESIDENTIEL_COLLECTIF | RESIDENTIEL_INDIVIDUEL | TERTIAIRE_INSTITUTIONNEL | COMMERCIAL
    @Size(max = 50)
    private String typeProjet;

    // LOGEMENT_SOCIAL | MOYEN_STANDING | HAUT_STANDING | VILLAS | LOTISSEMENT |
    // HOTEL | ECOLE | SANTE | ADMINISTRATION | BUREAUX | CENTRE_COMMERCIAL | RETAIL | MIXTE
    @Size(max = 50)
    private String sousTypeProjet;

    private Integer nombreUnites;

    // ETUDE_CONCEPTION | AUTORISATION | GROS_OEUVRE | SECOND_OEUVRE |
    // PHASE_EQUIPEMENT | LIVRAISON | CLOTURE
    @Size(max = 30)
    private String stadeChantier;

    // FERME | PARTIELLEMENT_OUVERT | LIBRE
    @Size(max = 30)
    private String niveauOpportunite;

    @Size(max = 255)
    private String concurrentFerme;

    @Size(max = 255)
    private String deciseur;

    // ACTIF | PRIORITAIRE | GAGNE | PERDU
    @Size(max = 20)
    private String statutChantier;

    @Size(max = 500)
    private String actionSuivante;

    private LocalDate dateProchaineAction;

    private Boolean temoin;

    @Size(max = 255)
    private String installateur;

    @Size(max = 255)
    private String promoteur;

    private String accountId;
    private String assignedToId;
    private String territoryId;

    private List<ActeurRequest> acteurs;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActeurRequest {
        // PROMOTEUR | ARCHITECTE | BUREAU_ETUDES | ENTREPRISE_GENERALE | INSTALLATEUR_PLOMBIER
        @NotBlank
        private String roleActeur;

        @NotBlank
        @Size(max = 255)
        private String nom;

        @Size(max = 20)
        private String telephone;
    }
}
