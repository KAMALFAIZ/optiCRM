package com.opticrm.core.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateContactRequest {

    @Size(max = 20, message = "Salutation must not exceed 20 characters")
    private String salutation;

    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must not exceed 100 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name must not exceed 100 characters")
    private String lastName;

    @Email(message = "Invalid email format")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    @Size(max = 20, message = "Mobile phone must not exceed 20 characters")
    private String phoneMobile;

    @Size(max = 20, message = "Office phone must not exceed 20 characters")
    private String phoneOffice;

    @Size(max = 100, message = "Job title must not exceed 100 characters")
    private String jobTitle;

    @Size(max = 100, message = "Department must not exceed 100 characters")
    private String department;

    // Address
    @Size(max = 255, message = "Street must not exceed 255 characters")
    private String addressStreet;

    @Size(max = 100, message = "City must not exceed 100 characters")
    private String addressCity;

    @Size(max = 100, message = "State must not exceed 100 characters")
    private String addressState;

    @Size(max = 20, message = "Postal code must not exceed 20 characters")
    private String addressPostalCode;

    @Size(max = 100, message = "Country must not exceed 100 characters")
    private String addressCountry;

    // Social
    @Size(max = 255, message = "LinkedIn URL must not exceed 255 characters")
    private String linkedinUrl;

    @Size(max = 100, message = "Twitter handle must not exceed 100 characters")
    private String twitterHandle;

    // Metadata
    private LocalDate dateOfBirth;

    @Size(max = 10, message = "Language code must not exceed 10 characters")
    private String preferredLanguage;

    private Boolean doNotCall;
    private Boolean doNotEmail;

    // Relations
    private String accountId;

    @Size(max = 50, message = "Contact role must not exceed 50 characters")
    private String contactRole;

    private String reportsToId;
    private String assignedToId;
}
