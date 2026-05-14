package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyzeAccountRequest {

    @NotBlank
    @Size(max = 300)
    private String accountName;

    @Size(max = 200)
    private String industry;

    @Size(max = 200)
    private String city;

    private Double revenueCurrentYear;
    private Double pipelineValue;
    private Double overdueAmount;
    private Integer contactCount;
}
