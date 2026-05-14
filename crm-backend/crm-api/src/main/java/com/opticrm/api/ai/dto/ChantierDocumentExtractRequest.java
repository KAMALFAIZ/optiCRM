package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChantierDocumentExtractRequest {
    @NotBlank
    @Size(max = 50000)
    private String documentText;

    @Pattern(regexp = "^(CCTP|BON_COMMANDE|PLAN|CONTRAT|AUTRE)$", message = "Invalid document type")
    private String documentType;
}
