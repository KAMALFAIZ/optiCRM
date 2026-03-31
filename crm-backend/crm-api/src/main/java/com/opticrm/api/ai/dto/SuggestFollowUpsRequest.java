package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuggestFollowUpsRequest {

    @NotBlank
    private String contactName;

    private String company;
    private String lastInteraction;
    private String lastInteractionDate;
    private String status;
    private String opportunityStage;
    private Double dealValue;
    private String notes;
}
