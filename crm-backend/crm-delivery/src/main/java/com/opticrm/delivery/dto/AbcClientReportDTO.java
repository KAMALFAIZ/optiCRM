package com.opticrm.delivery.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Analyse ABC des clients par CA sur une période. */
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AbcClientReportDTO {
    private BigDecimal totalRevenue;
    private int totalClients;
    private int countA; // top 80%
    private int countB; // 15%
    private int countC; // 5%
    private List<ClientRow> clients;

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ClientRow {
        private UUID customerId;
        private int rank;
        private BigDecimal revenue;
        private BigDecimal revenuePercent;      // % du CA total
        private BigDecimal cumulativePercent;   // % cumulé
        private String segment;                 // A, B ou C
        private int deliveryCount;
        private BigDecimal outstandingCredit;
    }
}
