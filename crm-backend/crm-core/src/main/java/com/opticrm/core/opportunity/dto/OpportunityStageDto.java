package com.opticrm.core.opportunity.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OpportunityStageDto {
    private String id;
    private String name;
    private String code;
    private Integer probability;
    private Integer sortOrder;
    private Boolean isClosed;
    private Boolean isWon;
    private String color;
}
