package com.opticrm.api.sage.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ExecuteQueryRequest {

    /** Requête SQL à exécuter sur le serveur Sage SQL Server */
    @NotBlank
    private String query;

    /** Type d'entité cible : ACCOUNTS | CONTACTS (pour audit uniquement) */
    private String entityType;
}
