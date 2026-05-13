package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassifyTicketRequest {

    @NotBlank
    @Size(max = 500)
    private String title;

    @Size(max = 5000)
    private String description;

    @Size(max = 300)
    private String accountName;
}
