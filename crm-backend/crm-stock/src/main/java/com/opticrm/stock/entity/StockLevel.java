package com.opticrm.stock.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "stock_levels", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"product_id", "warehouse_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class StockLevel {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "quantity_on_hand", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal quantityOnHand = BigDecimal.ZERO;

    @Column(name = "quantity_reserved", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal quantityReserved = BigDecimal.ZERO;

    // Note: quantity_available is computed in DB, but we can calculate it here too
    @Transient
    public BigDecimal getQuantityAvailable() {
        return quantityOnHand.subtract(quantityReserved);
    }

    @Column(name = "quantity_on_order", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal quantityOnOrder = BigDecimal.ZERO;

    @Column(name = "average_cost", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal averageCost = BigDecimal.ZERO;

    // Note: total_value is computed in DB, but we can calculate it here too
    @Transient
    public BigDecimal getTotalValue() {
        return quantityOnHand.multiply(averageCost);
    }

    @Column(name = "last_count_date")
    private LocalDate lastCountDate;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    // Helper to check if stock is low
    public boolean isLowStock() {
        if (product == null || product.getMinStockLevel() == null) {
            return false;
        }
        return getQuantityAvailable().compareTo(product.getMinStockLevel()) <= 0;
    }

    // Helper to check if reorder is needed
    public boolean needsReorder() {
        if (product == null || product.getReorderLevel() == null) {
            return false;
        }
        return getQuantityAvailable().compareTo(product.getReorderLevel()) <= 0;
    }
}
