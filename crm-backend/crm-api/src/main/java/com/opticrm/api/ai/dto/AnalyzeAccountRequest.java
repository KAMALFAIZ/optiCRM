package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyzeAccountRequest {

    @NotBlank
    private String accountName;

    private String industry;
    private String city;
    private Double revenueCurrentYear;
    private Double pipelineValue;
    private Double overdueAmount;
    private Integer contactCount;
}
