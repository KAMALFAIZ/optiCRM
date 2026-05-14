package com.opticrm.api.ai.dto;

import lombok.Data;

@Data
public class ChantierExtractResponse {
    private String nomChantier;
    private String maitrOuvrage;
    private String ville;
    private String typeProjet;
    private String sousTypeProjet;
    private String stadeChantier;
    private Integer nombreUnites;
    private String productsDetected;  // comma-separated products found
    private String delais;            // detected deadlines/milestones
    private String contacts;          // detected contact names/phones
    private String rawSummary;        // full AI summary of the document
}
