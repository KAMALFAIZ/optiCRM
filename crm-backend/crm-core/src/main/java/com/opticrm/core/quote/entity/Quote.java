package com.opticrm.core.quote.entity;

import com.opticrm.common.util.BaseEntity;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.chantier.entity.Chantier;
import com.opticrm.core.contact.entity.Contact;
import com.opticrm.core.opportunity.entity.Opportunity;
import com.opticrm.security.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "quotes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quote extends BaseEntity {

    @Column(name = "quote_number", nullable = false, unique = true)
    private String quoteNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private QuoteStatus status = QuoteStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id")
    private Contact contact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opportunity_id")
    private Opportunity opportunity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chantier_id")
    private Chantier chantier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @Column(name = "quote_date", nullable = false)
    private LocalDate quoteDate;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(length = 3)
    @Builder.Default
    private String currency = "MAD";

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "discount_type")
    private String discountType;

    @Column(name = "discount_value", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discountValue = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal total = BigDecimal.ZERO;

    @Column(name = "terms_and_conditions", columnDefinition = "TEXT")
    private String termsAndConditions;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "delivery_terms", columnDefinition = "TEXT")
    private String deliveryTerms;

    // Billing address
    @Column(name = "billing_street")
    private String billingStreet;

    @Column(name = "billing_city")
    private String billingCity;

    @Column(name = "billing_state")
    private String billingState;

    @Column(name = "billing_postal_code")
    private String billingPostalCode;

    @Column(name = "billing_country")
    private String billingCountry;

    // Shipping address
    @Column(name = "shipping_street")
    private String shippingStreet;

    @Column(name = "shipping_city")
    private String shippingCity;

    @Column(name = "shipping_state")
    private String shippingState;

    @Column(name = "shipping_postal_code")
    private String shippingPostalCode;

    @Column(name = "shipping_country")
    private String shippingCountry;

    // Signature fields
    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "signed_by")
    private String signedBy;

    @Column(name = "signature_ip")
    private String signatureIp;

    @Column(name = "pdf_url")
    private String pdfUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_quote_id")
    private Quote parentQuote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_terms_id")
    private com.opticrm.core.account.entity.PaymentTerms paymentTerms;

    @OneToMany(mappedBy = "quote", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<QuoteLineItem> lineItems = new ArrayList<>();

    public void addLineItem(QuoteLineItem lineItem) {
        lineItems.add(lineItem);
        lineItem.setQuote(this);
        recalculateTotals();
    }

    public void removeLineItem(QuoteLineItem lineItem) {
        lineItems.remove(lineItem);
        lineItem.setQuote(null);
        recalculateTotals();
    }

    public void recalculateTotals() {
        // Calculate subtotal from line items
        this.subtotal = lineItems.stream()
                .map(QuoteLineItem::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate discount
        if ("percentage".equals(this.discountType) && this.discountValue != null && this.discountValue.compareTo(BigDecimal.ZERO) > 0) {
            this.discountAmount = this.subtotal.multiply(this.discountValue)
                    .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
        } else if ("fixed".equals(this.discountType) && this.discountValue != null) {
            this.discountAmount = this.discountValue;
        }

        BigDecimal afterDiscount = this.subtotal.subtract(this.discountAmount != null ? this.discountAmount : BigDecimal.ZERO);

        // Calculate tax from line items
        this.taxAmount = lineItems.stream()
                .map(item -> item.getTaxAmount() != null ? item.getTaxAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate total
        this.total = afterDiscount.add(this.taxAmount != null ? this.taxAmount : BigDecimal.ZERO);
    }

    /**
     * Get name for display purposes (returns quote number)
     */
    public String getName() {
        return this.quoteNumber;
    }

    public enum QuoteStatus {
        DRAFT,
        SENT,
        VIEWED,
        ACCEPTED,
        REJECTED,
        EXPIRED,
        CANCELLED
    }
}
