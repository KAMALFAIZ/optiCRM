package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class ChantierAnalysisRequest {
    @NotNull
    private UUID chantierId;
}
