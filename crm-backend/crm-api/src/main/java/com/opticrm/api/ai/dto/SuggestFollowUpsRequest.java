package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuggestFollowUpsRequest {

    @NotBlank
    @Size(max = 300)
    private String contactName;

    @Size(max = 300)
    private String company;

    @Size(max = 500)
    private String lastInteraction;

    @Size(max = 50)
    private String lastInteractionDate;

    @Size(max = 100)
    private String status;

    @Size(max = 200)
    private String opportunityStage;

    private Double dealValue;

    @Size(max = 3000)
    private String notes;
}
