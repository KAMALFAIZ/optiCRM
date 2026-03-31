package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyzeLeadRequest {

    @NotBlank
    private String leadName;

    private String company;
    private String jobTitle;
    private String source;
    private String status;
    private String industry;
    private Double estimatedValue;
    private String notes;
}
