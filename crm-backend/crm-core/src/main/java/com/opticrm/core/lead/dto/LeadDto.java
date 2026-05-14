package com.opticrm.core.lead.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class LeadDto {
    private String id;
    private String salutation;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private String mobile;
    private String companyName;
    private String jobTitle;
    private String website;

    // Address
    private String street;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private String fullAddress;

    // Lead Info
    private String status;
    private String source;
    private String sourceDetails;
    private String rating;
    private Integer leadScore;
    private List<String> interestedProducts;
    private String budgetRange;
    private String decisionTimeframe;

    // Champs avancés
    private String fax;
    private String linkedinUrl;
    private String industry;
    private String numEmployees;
    private String annualRevenue;
    private String priority;
    private Boolean doNotCall;
    private Boolean doNotEmail;
    private LocalDate nextFollowUpDate;
    private String description;

    // Qualification avancée (V26)
    private String qualificationNotes;
    private String competitor;
    private Boolean productDemoRequested;
    private Instant meetingScheduledAt;

    // Relations
    private UserInfo assignedTo;
    private TerritoryInfo territory;
    private String campaignId;

    // Conversion
    private Boolean isConverted;
    private Instant convertedAt;
    private String convertedContactId;
    private String convertedAccountId;
    private String convertedOpportunityId;

    // Optimistic locking
    private Long version;

    // Audit
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastActivityAt;

    @Data
    @Builder
    public static class UserInfo {
        private String id;
        private String fullName;
        private String email;
    }

    @Data
    @Builder
    public static class TerritoryInfo {
        private String id;
        private String name;
        private String region;
    }
}
