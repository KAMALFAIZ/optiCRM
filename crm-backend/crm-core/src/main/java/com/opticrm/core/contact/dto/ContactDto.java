package com.opticrm.core.contact.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ContactDto {

    private String id;
    private String salutation;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phoneMobile;
    private String phoneOffice;
    private String jobTitle;
    private String department;

    // Address
    private String addressStreet;
    private String addressCity;
    private String addressState;
    private String addressPostalCode;
    private String addressCountry;
    private String fullAddress;

    // Social
    private String linkedinUrl;
    private String twitterHandle;

    // Metadata
    private LocalDate dateOfBirth;
    private String preferredLanguage;
    private Boolean doNotCall;
    private Boolean doNotEmail;

    // Relations
    private AccountSummary account;
    private String contactRole;
    private ContactSummary reportsTo;
    private UserSummary assignedTo;

    // Optimistic locking
    private Long version;

    // Audit
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccountSummary {
        private String id;
        private String name;
        private String accountType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContactSummary {
        private String id;
        private String fullName;
        private String jobTitle;
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
