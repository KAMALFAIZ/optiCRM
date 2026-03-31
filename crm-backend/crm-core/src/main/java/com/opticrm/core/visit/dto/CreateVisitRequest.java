package com.opticrm.core.visit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class CreateVisitRequest {

    private String contactId;
    private String accountId;

    @NotBlank(message = "Visit type is required")
    @Size(max = 50)
    private String visitType;

    @NotBlank(message = "Subject is required")
    @Size(max = 255)
    private String subject;

    private String description;

    @NotNull(message = "Visit date is required")
    private Instant visitDate;

    private Instant visitEndDate;

    private Integer duration;

    @Size(max = 50)
    private String status;

    private BigDecimal latitude;
    private BigDecimal longitude;

    @Size(max = 500)
    private String address;

    @Size(max = 100)
    private String city;

    private String notes;

    @Size(max = 50)
    private String outcome;

    private String nextAction;
    private String assignedToId;

    // --- Champs avancés ---
    @Size(max = 255)
    private String objective;
    @Size(max = 20)
    private String interestLevel;
    private Integer satisfaction;
    @Size(max = 255)
    private String competitorDetected;
    private String productsPresented;
    private BigDecimal estimatedAmount;
    @Size(max = 255)
    private String samplesDelivered;
    @Size(max = 50)
    private String transportMode;
    private BigDecimal mileage;
    private BigDecimal expenses;
    private Instant followUpDate;
    @Size(max = 20)
    private String followUpPriority;
    private Boolean nextVisitPlanned;
}
