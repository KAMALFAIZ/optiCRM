package com.opticrm.core.chantier.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChantierEchantillonDto {

    private String id;
    private String notes;
    private String statut;
    private String requestedBy;
    private Instant createdAt;
    private List<LigneDto> lignes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LigneDto {
        private String id;
        private String productId;
        private String productCode;
        private String productName;
        private Integer quantite;
    }
}
