package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateEmailRequest {

    @NotBlank
    private String subject;

    private String recipientName;
    private String recipientCompany;
    private String context;
    private String tone; // "professional", "friendly", "formal"
}
