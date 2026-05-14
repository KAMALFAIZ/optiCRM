package com.opticrm.delivery.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Payload envoyé par l'appareil mobile pour synchroniser les actions hors-ligne. */
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SyncPushDTO {

    private String deviceId;
    private UUID representativeId;
    private List<OfflineDeliveryLine> deliveryLines;
    private List<OfflineGpsPoint> gpsPoints;

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OfflineDeliveryLine {
        private UUID tourId;
        private UUID customerId;
        private UUID itemId;
        private Integer quantity;
        private BigDecimal unitPrice;
        private String paymentMode;
        private BigDecimal paidAmount;
        private String visitResult;
        private String visitNotes;
        private String chequeNumber;
        private LocalDate traiteDueDate;
        private UUID batchId;
        private String lotNumber;
        private LocalDate expiryDate;
        /** ISO-8601 timestamp de l'action hors-ligne (pour déduplication) */
        private String offlineTimestamp;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OfflineGpsPoint {
        private UUID tourId;
        private Double latitude;
        private Double longitude;
        private Double accuracy;
        private String eventType;
        private UUID customerId;
        private String recordedAt;
    }
}
