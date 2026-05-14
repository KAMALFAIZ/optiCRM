package com.opticrm.core.chantier.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChantierListDto {
    private String id;
    private String nom;
    private String ville;
    private String prefecture;
    private String typeProjet;
    private String sousTypeProjet;
    private Integer nombreUnites;
    private String segmentTaille;
    private String stadeChantier;
    private String niveauOpportunite;
    private String statutChantier;
    private String accountId;
    private String accountName;
    private String assignedToName;
    private LocalDate dateProchaineAction;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Boolean temoin;
    private Integer healthScore;
    private BigDecimal conversionProbability;
}
