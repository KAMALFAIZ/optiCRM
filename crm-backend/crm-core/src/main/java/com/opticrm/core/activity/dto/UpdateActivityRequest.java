package com.opticrm.core.activity.dto;

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
public class UpdateActivityRequest {

    @Size(max = 50)
    private String activityType;

    @Size(max = 255)
    private String subject;

    private String description;
    private Instant startDate;
    private Instant endDate;
    private Instant dueDate;
    private Integer duration;

    @Size(max = 255)
    private String location;

    @Size(max = 50)
    private String locationType;

    @Size(max = 50)
    private String status;

    @Size(max = 20)
    private String priority;

    @Size(max = 50)
    private String relatedToType;

    private String relatedToId;

    @Size(max = 20)
    private String callDirection;

    @Size(max = 50)
    private String callResult;

    private String assignedToId;
    private Boolean isRecurring;
    private String recurrenceRule;
    private Instant reminderAt;

    // --- Champs avancés ---
    @Size(max = 255)
    private String objective;
    private String result;
    private String productsDiscussed;
    private BigDecimal estimatedRevenue;
    private BigDecimal expenses;
    @Size(max = 50)
    private String transportMode;
    private BigDecimal mileage;
    private Instant followUpDate;
}
