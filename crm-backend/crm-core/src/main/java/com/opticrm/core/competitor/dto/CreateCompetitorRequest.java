package com.opticrm.core.competitor.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateCompetitorRequest {
    @NotBlank(message = "Le nom est obligatoire")
    private String name;
    private String website;
    private String description;
    private String strengths;
    private String weaknesses;
}
