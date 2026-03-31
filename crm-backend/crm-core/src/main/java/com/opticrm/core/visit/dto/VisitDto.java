package com.opticrm.core.visit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VisitDto {

    private String id;
    private String visitType;
    private String subject;
    private String description;
    private Instant visitDate;
    private Instant visitEndDate;
    private Integer duration;
    private String status;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String address;
    private String city;
    private Instant checkInAt;
    private Instant checkOutAt;
    private String notes;
    private String outcome;
    private String nextAction;

    // --- Champs avancés ---
    private String objective;
    private String interestLevel;
    private Integer satisfaction;
    private String competitorDetected;
    private String productsPresented;
    private BigDecimal estimatedAmount;
    private String samplesDelivered;
    private String transportMode;
    private BigDecimal mileage;
    private BigDecimal expenses;
    private Instant followUpDate;
    private String followUpPriority;
    private Boolean nextVisitPlanned;

    private ContactSummary contact;
    private AccountSummary account;
    private UserSummary assignedTo;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContactSummary {
        private String id;
        private String fullName;
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccountSummary {
        private String id;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private String id;
        private String fullName;
        private String email;
    }
}
