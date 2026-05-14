package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateEmailRequest {

    @NotBlank
    @Size(max = 500)
    private String subject;

    @Size(max = 200)
    private String recipientName;

    @Size(max = 200)
    private String recipientCompany;

    @Size(max = 2000)
    private String context;

    @Pattern(regexp = "^(professional|friendly|formal)$", message = "Tone must be 'professional', 'friendly', or 'formal'")
    private String tone;
}
