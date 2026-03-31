package com.opticrm.communication.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEmailTemplateRequest {

    @Size(max = 100, message = "Le nom ne doit pas dépasser 100 caractères")
    private String name;

    @Size(max = 255, message = "Le sujet ne doit pas dépasser 255 caractères")
    private String subject;

    private String bodyHtml;

    private String bodyText;

    @Size(max = 50, message = "La catégorie ne doit pas dépasser 50 caractères")
    private String category;

    private String availableVariables;
}
