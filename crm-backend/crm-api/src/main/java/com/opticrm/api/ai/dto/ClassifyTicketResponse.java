package com.opticrm.api.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassifyTicketResponse {

    private String category;   // SAV, TECHNIQUE, COMMERCIAL, FACTURATION, LIVRAISON, AUTRE
    private String priority;   // BASSE, NORMALE, HAUTE, CRITIQUE
    private String reasoning;  // Justification de la classification
}
