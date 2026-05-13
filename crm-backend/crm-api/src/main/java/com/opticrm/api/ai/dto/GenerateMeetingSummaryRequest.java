package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateMeetingSummaryRequest {

    @NotBlank
    @Size(max = 10000)
    private String notes;

    @Size(max = 100)
    private String meetingType;

    @Size(max = 500)
    private String participants;

    @Size(max = 50)
    private String date;

    @Size(max = 300)
    private String accountName;
}
