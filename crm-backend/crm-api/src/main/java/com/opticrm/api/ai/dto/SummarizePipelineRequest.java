package com.opticrm.api.ai.dto;

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
    private String topStage;
    private String period;
}
