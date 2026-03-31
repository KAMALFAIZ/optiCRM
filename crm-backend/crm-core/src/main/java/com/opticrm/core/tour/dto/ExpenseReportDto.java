package com.opticrm.core.tour.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExpenseReportDto {

    private UUID id;
    private String reportNumber;
    private String status;
    private String title;
    private String description;
    private BigDecimal totalAmount;
    private String currency;
    private Instant submittedAt;
    private Instant approvedAt;
    private Instant reimbursedAt;
    private String rejectionReason;

    private TourSummary tour;
    private UserSummary submittedBy;
    private UserSummary approvedBy;
    private List<ExpenseReportLineDto> lines;

    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TourSummary {
        private String id;
        private String name;
        private LocalDate tourDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private String id;
        private String fullName;
    }
}
