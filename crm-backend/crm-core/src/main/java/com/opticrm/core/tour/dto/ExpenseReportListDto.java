package com.opticrm.core.tour.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseReportListDto {

    private UUID id;
    private String reportNumber;
    private String status;
    private String title;
    private BigDecimal totalAmount;
    private String currency;
    private String tourName;
    private String tourId;
    private String submittedByName;
    private Instant submittedAt;
    private Instant createdAt;
    private int lineCount;
}
