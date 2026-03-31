package com.opticrm.finance.entity;

import com.opticrm.core.account.entity.Account;
import com.opticrm.security.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "invoices")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Invoice {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @Column(name = "invoice_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private InvoiceType invoiceType = InvoiceType.INVOICE;

    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "contact_id")
    private UUID contactId;

    @Column(name = "quote_id")
    private UUID quoteId;

    @Column(name = "order_id")
    private UUID orderId;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "subtotal", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal total = BigDecimal.ZERO;

    @Column(name = "amount_paid", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal amountPaid = BigDecimal.ZERO;

    // amount_due is GENERATED ALWAYS AS (total - amount_paid) STORED — read-only in JPA
    @Column(name = "amount_due", insertable = false, updatable = false, precision = 15, scale = 2)
    private BigDecimal amountDue;

    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "MAD";

    @Column(name = "billing_name")
    private String billingName;

    @Column(name = "billing_street")
    private String billingStreet;

    @Column(name = "billing_city", length = 100)
    private String billingCity;

    @Column(name = "billing_state", length = 100)
    private String billingState;

    @Column(name = "billing_postal_code", length = 20)
    private String billingPostalCode;

    @Column(name = "billing_country", length = 100)
    private String billingCountry;

    @Column(name = "payment_terms_id")
    private UUID paymentTermsId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<InvoiceLine> lines = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "paid_at")
    private Instant paidAt;

    // Helper methods
    public void addLine(InvoiceLine line) {
        lines.add(line);
        line.setInvoice(this);
    }

    public void removeLine(InvoiceLine line) {
        lines.remove(line);
        line.setInvoice(null);
    }

    public void clearLines() {
        lines.forEach(l -> l.setInvoice(null));
        lines.clear();
    }

    public void recalculate() {
        BigDecimal sub = BigDecimal.ZERO;
        BigDecimal tax = BigDecimal.ZERO;

        for (InvoiceLine line : lines) {
            line.recalculate();
            sub = sub.add(line.getTotal() != null ? line.getTotal() : BigDecimal.ZERO);
            tax = tax.add(line.getTaxAmount() != null ? line.getTaxAmount() : BigDecimal.ZERO);
        }

        this.subtotal = sub;
        this.taxAmount = tax;
        this.total = sub.add(tax).subtract(discountAmount != null ? discountAmount : BigDecimal.ZERO);
    }

    public boolean isOverdue() {
        return status != InvoiceStatus.PAID && status != InvoiceStatus.CANCELLED
                && dueDate != null && dueDate.isBefore(LocalDate.now());
    }

    public enum InvoiceType {
        INVOICE,
        CREDIT_NOTE,
        PROFORMA
    }

    public enum InvoiceStatus {
        DRAFT,
        SENT,
        PAID,
        PARTIALLY_PAID,
        OVERDUE,
        CANCELLED
    }
}
