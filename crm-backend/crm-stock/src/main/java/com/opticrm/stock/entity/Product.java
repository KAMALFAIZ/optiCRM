package com.opticrm.stock.entity;

import com.opticrm.core.account.entity.TaxRate;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "products")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Product {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ProductCategory category;

    @Column(name = "brand", length = 100)
    private String brand;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "cost_price", precision = 15, scale = 2)
    private BigDecimal costPrice;

    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "MAD";

    @Column(name = "unit_of_measure", length = 20)
    @Builder.Default
    private String unitOfMeasure = "unité";

    @Column(name = "is_stockable")
    @Builder.Default
    private Boolean isStockable = true;

    @Column(name = "min_stock_level", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal minStockLevel = BigDecimal.ZERO;

    @Column(name = "reorder_level", precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal reorderLevel = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_tax_rate_id")
    private TaxRate defaultTaxRate;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_sellable")
    @Builder.Default
    private Boolean isSellable = true;

    @Column(name = "is_purchasable")
    @Builder.Default
    private Boolean isPurchasable = true;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "datasheet_url", length = 500)
    private String datasheetUrl;

    @Column(name = "datasheet_name", length = 255)
    private String datasheetName;

    // Sage integration
    @Column(name = "sage_code", length = 50, unique = true)
    private String sageCode;

    @Column(name = "sage_synced_at")
    private Instant sageSyncedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    // Margin calculation helper
    public BigDecimal getMargin() {
        if (costPrice == null || costPrice.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return unitPrice.subtract(costPrice)
                .divide(costPrice, 4, java.math.RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));
    }

    // Profit calculation helper
    public BigDecimal getProfit() {
        if (costPrice == null) {
            return null;
        }
        return unitPrice.subtract(costPrice);
    }
}
