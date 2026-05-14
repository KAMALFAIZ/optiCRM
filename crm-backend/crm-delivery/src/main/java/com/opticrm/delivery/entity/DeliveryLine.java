package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "delivery_line")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryLine extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "delivery_tour_id", nullable = false)
    private DeliveryTour deliveryTour;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "item_id")
    private UUID itemId;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "amount", precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode")
    private PaymentMode paymentMode = PaymentMode.CASH;

    @Column(name = "paid_amount", precision = 12, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "visit_result", nullable = false)
    private VisitResult visitResult = VisitResult.DELIVERED;

    @Column(name = "visit_notes", length = 500)
    private String visitNotes;

    // Champs spécifiques aux modes de paiement étendus
    @Column(name = "cheque_number", length = 50)
    private String chequeNumber;

    @Column(name = "traite_due_date")
    private LocalDate traiteDueDate;

    // Quantité réellement remise au client (≤ quantity ; utile pour PARTIAL)
    @Column(name = "quantity_delivered")
    private Integer quantityDelivered;

    // Remise commerciale ponctuelle (0‒100 %)
    @Column(name = "discount_percent", precision = 5, scale = 2)
    private java.math.BigDecimal discountPercent = java.math.BigDecimal.ZERO;

    @Column(name = "discount_reason", length = 255)
    private String discountReason;

    // Traçabilité lot (FEFO)
    @Column(name = "batch_id")
    private UUID batchId;

    @Column(name = "lot_number", length = 100)
    private String lotNumber;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    public enum PaymentMode {
        CASH,
        CREDIT,
        CHEQUE,    // Chèque bancaire
        TRAITE,    // Lettre de change / LCN
        VIREMENT   // Virement bancaire
    }

    public enum VisitResult {
        DELIVERED,    // Livraison effectuée
        ABSENT,       // Client absent
        REFUSED,      // Client a refusé
        CLOSED,       // Commerce fermé
        PARTIAL       // Livraison partielle
    }
}
