package com.opticrm.core.vente.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class VenteSaisieDto {

    private UUID id;

    // Compte
    private UUID accountId;
    private String accountName;

    // Créateur
    private UUID createdById;
    private String createdByName;

    // Données vente
    private String reference;
    private LocalDate dateVente;
    private BigDecimal montantHt;
    private BigDecimal montantTtc;
    private String description;
    private String statut;

    // Audit
    private Instant createdAt;
    private Instant updatedAt;
}
