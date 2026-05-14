package com.opticrm.core.tour.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class CreateTourRequest {

    @NotBlank(message = "Tour name is required")
    @Size(max = 255)
    private String name;

    private String description;

    @NotNull(message = "Tour date is required")
    private LocalDate tourDate;

    @Size(max = 100)
    private String region;

    @Size(max = 500)
    private String startAddress;
    private BigDecimal startLatitude;
    private BigDecimal startLongitude;

    @Size(max = 500)
    private String endAddress;
    private BigDecimal endLatitude;
    private BigDecimal endLongitude;

    private String notes;
    private String assignedToId;
    private List<String> visitIds;

    // --- Champs avancés ---
    private String objective;
    private String tourResult;
    private BigDecimal estimatedRevenue;
    private BigDecimal actualRevenue;
    @Size(max = 50)
    private String vehicleType;
    private BigDecimal fuelCost;
    private BigDecimal totalExpenses;
    private Instant startTime;
    private Instant endTime;
    private String followUpNotes;
}
