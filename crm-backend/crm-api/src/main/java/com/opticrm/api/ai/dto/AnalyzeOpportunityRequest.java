package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyzeOpportunityRequest {

    @NotBlank
    private String opportunityName;

    private String stageName;
    private Double amount;
    private Integer probability;
    private String closeDate;
    private String accountName;
    private String productNames;
    private String notes;
}
