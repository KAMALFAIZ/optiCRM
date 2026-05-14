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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TourDto {

    private String id;
    private String name;
    private String description;
    private LocalDate tourDate;
    private String status;
    private String region;
    private Integer totalVisits;
    private Integer completedVisits;
    private BigDecimal totalDistance;
    private String startAddress;
    private BigDecimal startLatitude;
    private BigDecimal startLongitude;
    private String endAddress;
    private BigDecimal endLatitude;
    private BigDecimal endLongitude;
    private String notes;

    // --- Champs avancés ---
    private String objective;
    private String tourResult;
    private BigDecimal estimatedRevenue;
    private BigDecimal actualRevenue;
    private String vehicleType;
    private BigDecimal fuelCost;
    private BigDecimal totalExpenses;
    private Instant startTime;
    private Instant endTime;
    private String followUpNotes;

    // --- Notes de frais ---
    private Integer expenseReportCount;
    private BigDecimal totalExpenseReportsAmount;

    private UserSummary assignedTo;
    private List<TourVisitItem> visits;
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

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TourVisitItem {
        private String visitId;
        private Integer visitOrder;
        private String subject;
        private String visitType;
        private String status;
        private String address;
        private String city;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private String contactName;
        private String accountName;
        private Instant visitDate;
    }
}
