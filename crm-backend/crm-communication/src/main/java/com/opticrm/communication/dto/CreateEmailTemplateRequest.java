package com.opticrm.communication.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEmailTemplateRequest {

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 100, message = "Le nom ne doit pas dépasser 100 caractères")
    private String name;

    @NotBlank(message = "Le sujet est obligatoire")
    @Size(max = 255, message = "Le sujet ne doit pas dépasser 255 caractères")
    private String subject;

    @NotBlank(message = "Le contenu HTML est obligatoire")
    private String bodyHtml;

    private String bodyText;

    @Size(max = 50, message = "La catégorie ne doit pas dépasser 50 caractères")
    private String category;

    private String availableVariables;
}
