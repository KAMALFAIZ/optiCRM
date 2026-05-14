package com.opticrm.core.opportunity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Vue complète du pipeline commercial avec prévision de revenus.
 * Retournée par GET /api/v1/opportunities/pipeline
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipelineSummaryDto {

    /** Étapes du pipeline avec leurs opportunités */
    private List<PipelineStageDto> stages;

    /** Somme de tous les montants ouverts */
    private BigDecimal totalPipeline;

    /** Somme pondérée (amount × probability) */
    private BigDecimal totalWeighted;

    /** Commit : probabilité ≥ 80% (quasi-sûr) */
    private BigDecimal commitAmount;

    /** Best Case : probabilité 50–79% */
    private BigDecimal bestCaseAmount;

    /** Pipeline : probabilité < 50% */
    private BigDecimal pipelineAmount;

    /** Nombre total d'opportunités ouvertes */
    private int totalCount;
}
