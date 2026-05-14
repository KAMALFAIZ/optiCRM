package com.opticrm.delivery.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TourReportDTO {
    private UUID tourId;
    private LocalDate tourDate;
    private String zone;
    private UUID representativeId;
    private String tourStatus;
    private int lineCount;
    private int deliveredCount;
    private int absentCount;
    private int refusedCount;
    private BigDecimal totalAmount;
    private BigDecimal cashAmount;
    private BigDecimal creditAmount;
    private BigDecimal collectedAmount;
    private BigDecimal outstandingCredit;
    private int collectionRate;
}
