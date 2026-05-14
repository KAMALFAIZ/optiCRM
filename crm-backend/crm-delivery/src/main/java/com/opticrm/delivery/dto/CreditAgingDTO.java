package com.opticrm.delivery.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CreditAgingDTO {

    // Résumé global
    private BigDecimal totalOutstanding;
    private BigDecimal bucket0_30;    // 0-30 jours
    private BigDecimal bucket31_60;   // 31-60 jours
    private BigDecimal bucket61_90;   // 61-90 jours
    private BigDecimal bucketOver90;  // +90 jours

    private List<CreditLine> lines;

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CreditLine {
        private UUID lineId;
        private UUID customerId;
        private UUID tourId;
        private LocalDate tourDate;
        private int agingDays;            // jours depuis la tournée
        private String agingBucket;       // "0-30" | "31-60" | "61-90" | "+90"
        private BigDecimal invoicedAmount;
        private BigDecimal paidAmount;
        private BigDecimal outstanding;
        private String tourStatus;
    }
}
