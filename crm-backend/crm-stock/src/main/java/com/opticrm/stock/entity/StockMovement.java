package com.opticrm.stock.entity;

import com.opticrm.security.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "stock_movements")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class StockMovement {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "movement_type", nullable = false, length = 50)
    private String movementType; // PURCHASE, SALE, ADJUSTMENT, RETURN, TRANSFER, DAMAGE, INVENTORY

    @Column(name = "quantity", nullable = false, precision = 15, scale = 3)
    private BigDecimal quantity; // Positive for IN, Negative for OUT

    @Column(name = "unit_cost", precision = 15, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "reference_type", length = 50)
    private String referenceType; // QUOTE, INVOICE, PURCHASE_ORDER, MANUAL

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "quantity_after", precision = 15, scale = 3)
    private BigDecimal quantityAfter; // Stock level after this movement

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @CreatedBy
    @Column(name = "created_by_id", insertable = false, updatable = false)
    private UUID createdById;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // Movement type constants
    public static final String TYPE_PURCHASE = "PURCHASE";
    public static final String TYPE_SALE = "SALE";
    public static final String TYPE_ADJUSTMENT = "ADJUSTMENT";
    public static final String TYPE_RETURN = "RETURN";
    public static final String TYPE_TRANSFER = "TRANSFER";
    public static final String TYPE_DAMAGE = "DAMAGE";
    public static final String TYPE_INVENTORY = "INVENTORY";

    // Reference type constants
    public static final String REF_QUOTE = "QUOTE";
    public static final String REF_INVOICE = "INVOICE";
    public static final String REF_PURCHASE_ORDER = "PURCHASE_ORDER";
    public static final String REF_MANUAL = "MANUAL";

    // Helper to check if this is an inbound movement
    public boolean isInbound() {
        return quantity != null && quantity.compareTo(BigDecimal.ZERO) > 0;
    }

    // Helper to check if this is an outbound movement
    public boolean isOutbound() {
        return quantity != null && quantity.compareTo(BigDecimal.ZERO) < 0;
    }
}
