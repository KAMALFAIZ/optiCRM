package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateSalesInsightsRequest {

    @NotBlank
    private String period;

    private Double caRealise;
    private Double caObjectif;
    private Double tauxAtteinte;
    private Integer nbExceeded;
    private Integer nbAchieved;
    private Integer nbInProgress;
    private Integer nbFailed;
}
