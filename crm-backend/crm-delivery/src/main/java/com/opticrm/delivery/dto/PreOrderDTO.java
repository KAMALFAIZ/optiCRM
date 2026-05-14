package com.opticrm.delivery.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PreOrderDTO {
    private UUID id;
    private UUID deliveryTourId;     // Nullable — commande prévisionnelle sans tournée
    private UUID customerId;
    private LocalDate scheduledDate; // Date de livraison souhaitée (prochaine visite)
    private String status;
    private String notes;
    private Instant createdAt;
    private Integer visitOrder;
    private List<PreOrderItemDTO> items;

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PreOrderItemDTO {
        private UUID id;
        private UUID itemId;
        private Integer quantityOrdered;
        private Integer quantityConfirmed;
        private BigDecimal unitPrice;
    }
}
