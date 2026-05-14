package com.opticrm.core.opportunity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateOpportunityRequest {

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 255)
    private String name;

    private BigDecimal amount;

    @Size(max = 3)
    private String currency = "MAD";

    private Integer probability;

    @NotNull(message = "L'étape est obligatoire")
    private String stageId;

    private LocalDate closeDate;

    @Size(max = 50)
    private String type;

    @Size(max = 50)
    private String leadSource;

    @NotNull(message = "Le compte est obligatoire")
    private String accountId;

    private String primaryContactId;
    private String assignedToId;
    private String leadId;
    private String campaignId;

    private String description;
    private String nextStep;
    private List<String> tags;
}
