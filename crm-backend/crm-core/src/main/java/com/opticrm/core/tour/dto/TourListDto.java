package com.opticrm.core.tour.dto;

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
public class TourListDto {

    private String id;
    private String name;
    private LocalDate tourDate;
    private String status;
    private String region;
    private Integer totalVisits;
    private Integer completedVisits;
    private String assignedToName;
    private Instant createdAt;
}
