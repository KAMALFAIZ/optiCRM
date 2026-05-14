package com.opticrm.core.chantier.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateChantierRequest {

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

    @Size(max = 50)
    private String typeProjet;

    @Size(max = 50)
    private String sousTypeProjet;

    private Integer nombreUnites;

    @Size(max = 30)
    private String stadeChantier;

    @Size(max = 30)
    private String niveauOpportunite;

    @Size(max = 255)
    private String concurrentFerme;

    @Size(max = 255)
    private String deciseur;

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
}
