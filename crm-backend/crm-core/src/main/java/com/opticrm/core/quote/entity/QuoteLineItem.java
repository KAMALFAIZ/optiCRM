package com.opticrm.core.quote.entity;

import com.opticrm.core.account.entity.TaxRate;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "quote_lines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuoteLineItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quote_id", nullable = false)
    private Quote quote;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "product_code", length = 50)
    private String productCode;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 15, scale = 3)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "unit_of_measure", length = 20)
    @Builder.Default
    private String unitOfMeasure = "unité";

    @Column(name = "discount_type", length = 20)
    private String discountType;

    @Column(name = "discount_value", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discountValue = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    // subtotal is a generated column in DB (quantity * unit_price)
    // We make it insertable=false, updatable=false to let DB handle it
    @Column(name = "subtotal", precision = 15, scale = 2, insertable = false, updatable = false)
    private BigDecimal subtotal;

    @Column(precision = 15, scale = 2)
    private BigDecimal total;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tax_rate_id")
    private TaxRate taxRateEntity;

    @Column(name = "tax_rate", precision = 5, scale = 2)
    private BigDecimal taxRate;

    @Column(name = "tax_amount", precision = 15, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "stock_available", precision = 15, scale = 3)
    private BigDecimal stockAvailable;

    @Column(name = "stock_status", length = 20)
    private String stockStatus;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        calculateTotal();
    }

    @PreUpdate
    protected void onUpdate() {
        calculateTotal();
    }

    public void calculateTotal() {
        BigDecimal baseAmount = this.unitPrice.multiply(this.quantity);

        // Apply discount
        BigDecimal discount = BigDecimal.ZERO;
        if ("percentage".equals(this.discountType) && this.discountValue != null && this.discountValue.compareTo(BigDecimal.ZERO) > 0) {
            discount = baseAmount.multiply(this.discountValue)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            this.discountAmount = discount;
        } else if ("fixed".equals(this.discountType) && this.discountValue != null) {
            discount = this.discountValue;
            this.discountAmount = discount;
        }

        BigDecimal afterDiscount = baseAmount.subtract(discount);

        // Calculate tax
        if (this.taxRate != null && this.taxRate.compareTo(BigDecimal.ZERO) > 0) {
            this.taxAmount = afterDiscount.multiply(this.taxRate)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            this.taxAmount = BigDecimal.ZERO;
        }

        this.total = afterDiscount.add(this.taxAmount);
    }

    /**
     * Get line total for calculations (returns total or calculated value)
     */
    public BigDecimal getTotal() {
        if (this.total == null) {
            calculateTotal();
        }
        return this.total;
    }
}
