package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "payment_instrument")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PaymentInstrument extends BaseEntity {

    @Column(name = "delivery_line_id", nullable = false)
    private UUID deliveryLineId;

    @Enumerated(EnumType.STRING)
    @Column(name = "instrument_type", nullable = false)
    private InstrumentType instrumentType;

    @Column(name = "instrument_number", nullable = false, length = 100)
    private String instrumentNumber;

    @Column(name = "bank_name", length = 200)
    private String bankName;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    // Date d'échéance (traite) ou date d'encaissement prévu (chèque)
    @Column(name = "due_date")
    private LocalDate dueDate;

    // Date réelle d'encaissement
    @Column(name = "encash_date")
    private LocalDate encashDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InstrumentStatus status = InstrumentStatus.PENDING;

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @Column(name = "notes", length = 500)
    private String notes;

    public enum InstrumentType {
        CHEQUE,
        TRAITE
    }

    public enum InstrumentStatus {
        PENDING,    // En attente d'encaissement
        ENCAISSE,   // Encaissé avec succès
        REJETE      // Rejeté (chèque sans provision, traite impayée)
    }
}
