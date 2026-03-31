package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateMeetingSummaryRequest {

    @NotBlank
    private String notes;

    private String meetingType;
    private String participants;
    private String date;
    private String accountName;
}
