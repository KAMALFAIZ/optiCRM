package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChantierDocumentExtractRequest {
    @NotBlank
    private String documentText;  // Text content pasted from document
    private String documentType;  // CCTP, BON_COMMANDE, PLAN, CONTRAT, AUTRE
}
