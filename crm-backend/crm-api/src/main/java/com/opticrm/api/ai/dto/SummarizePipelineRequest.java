package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SummarizePipelineRequest {

    private Integer totalOpportunities;
    private Double totalValue;
    private Integer wonCount;
    private Integer lostCount;
    private Integer inProgressCount;
    private Double winRate;

    @Size(max = 200)
    private String topStage;

    @Size(max = 100)
    private String period;
}
