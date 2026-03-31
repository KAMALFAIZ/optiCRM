package com.opticrm.core.opportunity.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PipelineStageDto {
    private String id;
    private String name;
    private String code;
    private String color;
    private Integer sortOrder;
    private Boolean isClosed;
    private Boolean isWon;
    private Integer probability;

    /** Opportunités dans cette étape */
    private List<OpportunityListDto> opportunities;

    /** Nombre d'opportunités */
    private int count;

    /** Somme des montants */
    private BigDecimal totalAmount;

    /** Somme des montants pondérés (amount × probability / 100) */
    private BigDecimal weightedAmount;
}
