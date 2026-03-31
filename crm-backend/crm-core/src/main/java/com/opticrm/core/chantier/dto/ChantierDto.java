package com.opticrm.core.chantier.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChantierDto {

    private String id;

    // A. Identification
    private String nom;
    private String ville;
    private String prefecture;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String adresse;

    // B. Typologie
    private String typeProjet;
    private String sousTypeProjet;

    // C. Taille
    private Integer nombreUnites;
    private String segmentTaille; // calculé par DB : S/M/L/XL

    // D. Pipeline
    private String stadeChantier;
    private Instant stadeChangedAt;

    // E. Acteurs
    private List<ChantierActeurDto> acteurs;

    // F. Niveau d'opportunité
    private String niveauOpportunite;
    private String concurrentFerme;
    private String deciseur;

    // G. Suivi commercial
    private String statutChantier;
    private String actionSuivante;
    private LocalDate dateProchaineAction;

    // H. Témoin
    private Boolean temoin;

    // I. Installateur
    private String installateur;

    // J. Promoteur
    private String promoteur;

    // Relations
    private AccountSummary account;
    private UserSummary assignedTo;
    private TerritorySummary territory;

    // Audit
    private Instant createdAt;
    private Instant updatedAt;

    // AI
    private Integer healthScore;
    private BigDecimal conversionProbability;
    private String aiSummary;
    private Instant lastAiAnalysisAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AccountSummary {
        private String id;
        private String name;
        private String billingCity;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserSummary {
        private String id;
        private String fullName;
        private String email;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TerritorySummary {
        private String id;
        private String name;
        private String region;
    }
}
