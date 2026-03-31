package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassifyTicketRequest {

    @NotBlank
    private String title;

    private String description;

    private String accountName;
}
