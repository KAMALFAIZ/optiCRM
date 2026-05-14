package com.opticrm.api.sage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class CreateSyncRequestRequest {

    @NotBlank
    private String entityType;   // ACCOUNTS | CONTACTS | CA | OBJECTIVES

    private String label;

    private String sourceFormat; // CSV | MANUAL

    private Integer periodYear;
    private Integer periodMonth;

    /** Lignes de données brutes (chaque ligne = une Map<colonne, valeur>) */
    @NotEmpty
    private List<Map<String, Object>> rows;
}
