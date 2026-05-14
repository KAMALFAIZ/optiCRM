package com.opticrm.core.chantier.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEchantillonRequest {

    private String notes;

    @NotEmpty(message = "Au moins un produit est requis")
    @Valid
    private List<LigneRequest> lignes;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LigneRequest {

        private String productId;

        @NotBlank(message = "Le code produit est obligatoire")
        private String productCode;

        @NotBlank(message = "Le nom du produit est obligatoire")
        private String productName;

        @Min(value = 1, message = "La quantité doit être au moins 1")
        private Integer quantite = 1;
    }
}
