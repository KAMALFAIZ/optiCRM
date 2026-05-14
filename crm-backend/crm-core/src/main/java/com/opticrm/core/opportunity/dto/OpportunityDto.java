package com.opticrm.core.opportunity.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class OpportunityDto {
    private String id;
    private String name;
    private BigDecimal amount;
    private String currency;
    private Integer probability;
    private BigDecimal weightedAmount;

    private OpportunityStageDto stage;
    private Instant stageChangedAt;

    private LocalDate closeDate;
    private LocalDate actualCloseDate;
    private String type;
    private String leadSource;

    // Relations
    private AccountInfo account;
    private ContactInfo primaryContact;
    private UserInfo assignedTo;
    private String leadId;
    private String campaignId;

    // Status
    private Boolean isWon;
    private Boolean isClosed;
    private String closeReason;
    private String competitorId;

    // Details
    private String description;
    private String nextStep;
    private List<String> tags;

    // Optimistic locking
    private Long version;

    // Audit
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    public static class AccountInfo {
        private String id;
        private String name;
        private String accountType;
    }

    @Data
    @Builder
    public static class ContactInfo {
        private String id;
        private String fullName;
        private String email;
        private String phone;
    }

    @Data
    @Builder
    public static class UserInfo {
        private String id;
        private String fullName;
        private String email;
    }
}
