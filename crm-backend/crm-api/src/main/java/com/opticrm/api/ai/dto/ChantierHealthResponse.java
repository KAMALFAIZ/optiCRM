package com.opticrm.api.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChantierHealthResponse {
    private Integer score;          // 0-100
    private String label;           // CRITIQUE / A_RISQUE / ATTENTION / BON / EXCELLENT
    private String color;           // red / orange / gold / green / cyan
    private String detail;          // explanation text
    private Integer scoreVisites;   // 0-25
    private Integer scorePipeline;  // 0-25
    private Integer scoreOpportunite; // 0-25
    private Integer scoreProfil;    // 0-25
}
