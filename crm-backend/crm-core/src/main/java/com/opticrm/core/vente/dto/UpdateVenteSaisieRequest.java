package com.opticrm.core.vente.dto;

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
public class UpdateVenteSaisieRequest {

    private UUID accountId;

    @Size(max = 100)
    private String reference;

    private LocalDate dateVente;
    private BigDecimal montantHt;
    private BigDecimal montantTtc;
    private String description;

    @Size(max = 30)
    private String statut;
}
