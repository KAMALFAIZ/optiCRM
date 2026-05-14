package com.opticrm.core.lead.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateLeadRequest {

    @Size(max = 20)
    private String salutation;

    @Size(max = 100)
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 100)
    private String lastName;

    @Size(max = 255)
    private String email;

    @Size(max = 20)
    private String phone;

    @Size(max = 20)
    private String mobile;

    @Size(max = 255)
    private String companyName;

    @Size(max = 100)
    private String jobTitle;

    @Size(max = 255)
    private String website;

    // Address
    @Size(max = 255)
    private String street;

    @Size(max = 100)
    private String city;

    @Size(max = 100)
    private String state;

    @Size(max = 20)
    private String postalCode;

    @Size(max = 100)
    private String country;

    // Lead Info
    @Size(max = 50)
    private String status;

    @Size(max = 50)
    private String source;

    @Size(max = 255)
    private String sourceDetails;

    @Size(max = 20)
    private String rating;

    private Integer leadScore;

    private List<String> interestedProducts;

    @Size(max = 50)
    private String budgetRange;

    @Size(max = 50)
    private String decisionTimeframe;

    // Champs avancés
    @Size(max = 20)
    private String fax;

    @Size(max = 255)
    private String linkedinUrl;

    @Size(max = 100)
    private String industry;

    @Size(max = 50)
    private String numEmployees;

    @Size(max = 50)
    private String annualRevenue;

    @Size(max = 20)
    private String priority;

    private Boolean doNotCall;
    private Boolean doNotEmail;

    private LocalDate nextFollowUpDate;

    private String description;

    // Qualification avancée (V26)
    private String qualificationNotes;

    @Size(max = 200)
    private String competitor;

    private Boolean productDemoRequested;

    private Instant meetingScheduledAt;

    // Relations
    private String assignedToId;
    private String territoryId;
    private String campaignId;
}
