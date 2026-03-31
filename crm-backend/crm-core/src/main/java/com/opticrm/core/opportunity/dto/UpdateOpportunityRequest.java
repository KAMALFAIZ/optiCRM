package com.opticrm.core.opportunity.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateOpportunityRequest {

    @Size(max = 255)
    private String name;

    private BigDecimal amount;

    @Size(max = 3)
    private String currency;

    private Integer probability;

    private String stageId;

    private LocalDate closeDate;

    @Size(max = 50)
    private String type;

    @Size(max = 50)
    private String leadSource;

    private String accountId;
    private String primaryContactId;
    private String assignedToId;

    private Boolean isClosed;
    private Boolean isWon;
    private String closeReason;
    private String competitorId;

    private String description;
    private String nextStep;
    private List<String> tags;

    // Optimistic locking
    private Long version;
}
