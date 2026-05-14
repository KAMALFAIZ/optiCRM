package com.opticrm.delivery.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryLineDTO {
    private UUID id;
    private UUID deliveryTourId;
    private UUID customerId;
    private UUID itemId;
    private Integer quantity;
    private Integer quantityDelivered;
    private BigDecimal unitPrice;
    private BigDecimal discountPercent;
    private String discountReason;
    private BigDecimal amount;
    private String paymentMode;
    private BigDecimal paidAmount;
    private String visitResult;
    private String visitNotes;
    // Modes de paiement étendus
    private String chequeNumber;
    private LocalDate traiteDueDate;
    // Prix résolu automatiquement (lecture seule, retourné par l'API)
    private BigDecimal resolvedUnitPrice;
    // Traçabilité lot
    private UUID batchId;
    private String lotNumber;
    private LocalDate expiryDate;
}
