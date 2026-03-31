package com.opticrm.core.activity.dto;

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
public class ActivityDto {

    private String id;
    private String activityType;
    private String subject;
    private String description;
    private Instant startDate;
    private Instant endDate;
    private Instant dueDate;
    private Instant completedAt;
    private Integer duration;
    private String location;
    private String locationType;
    private String status;
    private String priority;
    private String relatedToType;
    private String relatedToId;
    private String callDirection;
    private String callResult;
    private Boolean isRecurring;
    private String recurrenceRule;
    private Instant reminderAt;

    // --- Champs avancés ---
    private String objective;
    private String result;
    private String productsDiscussed;
    private BigDecimal estimatedRevenue;
    private BigDecimal expenses;
    private String transportMode;
    private BigDecimal mileage;
    private Instant followUpDate;

    private UserSummary assignedTo;
    private Instant createdAt;
    private Instant updatedAt;

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
