package com.opticrm.core.vente.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVenteSaisieRequest {

    @NotNull(message = "Le compte est obligatoire")
    private UUID accountId;

    @Size(max = 100, message = "La référence ne doit pas dépasser 100 caractères")
    private String reference;

    @NotNull(message = "La date de vente est obligatoire")
    private LocalDate dateVente;

    @NotNull(message = "Le montant HT est obligatoire")
    private BigDecimal montantHt;

    @NotNull(message = "Le montant TTC est obligatoire")
    private BigDecimal montantTtc;

    private String description;

    @Size(max = 30)
    private String statut; // CONFIRME | EN_ATTENTE | ANNULE
}
