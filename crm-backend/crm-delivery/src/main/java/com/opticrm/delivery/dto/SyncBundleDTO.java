package com.opticrm.delivery.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SyncBundleDTO {

    private UUID repId;
    private LocalDate date;
    private Instant generatedAt;

    private TourInfo tour;
    private List<LoadItem> vehicleLoads;
    private List<PreOrderDTO> preOrders;
    private List<ActivePromotion> promotions;

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TourInfo {
        private UUID tourId;
        private LocalDate tourDate;
        private String zone;
        private String status;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LoadItem {
        private UUID itemId;
        private Integer quantity;
        private String lotNumber;
        private LocalDate expiryDate;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ActivePromotion {
        private UUID promotionId;
        private String name;
        private UUID itemId;
        private Integer minQuantity;
        private UUID bonusItemId;
        private Integer bonusQuantity;
        private String zone;
        private LocalDate validTo;
    }
}
