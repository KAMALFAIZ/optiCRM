package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyzeOpportunityRequest {

    @NotBlank
    @Size(max = 300)
    private String opportunityName;

    @Size(max = 200)
    private String stageName;

    private Double amount;
    private Integer probability;

    @Size(max = 50)
    private String closeDate;

    @Size(max = 300)
    private String accountName;

    @Size(max = 500)
    private String productNames;

    @Size(max = 3000)
    private String notes;
}
