package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyzeLeadRequest {

    @NotBlank
    @Size(max = 300)
    private String leadName;

    @Size(max = 300)
    private String company;

    @Size(max = 200)
    private String jobTitle;

    @Size(max = 100)
    private String source;

    @Size(max = 100)
    private String status;

    @Size(max = 200)
    private String industry;

    private Double estimatedValue;

    @Size(max = 3000)
    private String notes;
}
