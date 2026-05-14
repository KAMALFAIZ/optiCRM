package com.opticrm.core.opportunity.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
public class OpportunityListDto {
    private String id;
    private String name;
    private BigDecimal amount;
    private String currency;
    private Integer probability;
    private BigDecimal weightedAmount;

    private String stageId;
    private String stageName;
    private String stageColor;
    private Boolean isClosed;
    private Boolean isWon;

    private LocalDate closeDate;

    private String accountId;
    private String accountName;

    private String primaryContactId;
    private String primaryContactName;

    private String assignedToId;
    private String assignedToName;

    private Instant createdAt;
    private Instant stageChangedAt;

    // Champs avancés pipeline (V25)
    private String forecastCategory;
    private LocalDate nextFollowupDate;
    private String competitorName;
}
