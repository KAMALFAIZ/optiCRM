package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "settlement_report")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SettlementReport extends BaseEntity {

    @Column(name = "delivery_tour_id", nullable = false)
    private UUID deliveryTourId;

    // ── Montants facturés ──────────────────────────────
    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    // ── Encaissements détaillés ────────────────────────
    @Column(name = "collected_amount", precision = 12, scale = 2)
    private BigDecimal collectedAmount = BigDecimal.ZERO;

    @Column(name = "cash_amount", precision = 12, scale = 2)
    private BigDecimal cashAmount = BigDecimal.ZERO;       // Espèces

    @Column(name = "cheque_amount", precision = 12, scale = 2)
    private BigDecimal chequeAmount = BigDecimal.ZERO;     // Chèques

    @Column(name = "traite_amount", precision = 12, scale = 2)
    private BigDecimal traiteAmount = BigDecimal.ZERO;     // Traites / LCN

    @Column(name = "virement_amount", precision = 12, scale = 2)
    private BigDecimal virementAmount = BigDecimal.ZERO;   // Virements bancaires

    // ── Impayés ────────────────────────────────────────
    @Column(name = "credit_amount", precision = 12, scale = 2)
    private BigDecimal creditAmount = BigDecimal.ZERO;     // Ventes à crédit

    @Column(name = "credit_balance", precision = 12, scale = 2)
    private BigDecimal creditBalance = BigDecimal.ZERO;    // = creditAmount - paiements partiels

    // ── Stock non vendu ────────────────────────────────
    @Column(name = "unloaded_value", precision = 12, scale = 2)
    private BigDecimal unloadedValue = BigDecimal.ZERO;    // Valeur stock retourné dépôt

    // ── Contrôle ───────────────────────────────────────
    @Column(name = "discrepancy", precision = 12, scale = 2)
    private BigDecimal discrepancy = BigDecimal.ZERO;      // Écart caisse (théorique - physique)

    // ── Rapprochement stock ────────────────────────────
    @Column(name = "stock_theoretical")
    private Integer stockTheoretical = 0;                  // Chargé - vendu (calculé)

    @Column(name = "stock_physical")
    private Integer stockPhysical = 0;                     // Compté physiquement au retour

    @Column(name = "stock_discrepancy")
    private Integer stockDiscrepancy = 0;                  // stockPhysical - stockTheoretical

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @Column(name = "finalized_at")
    private LocalDateTime finalizedAt;

    @Column(name = "finalized_by")
    private UUID finalizedBy;

    // ── Approbation des écarts ─────────────────────────────
    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approval_notes", length = 500)
    private String approvalNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private SettlementStatus status = SettlementStatus.DRAFT;

    public enum SettlementStatus {
        DRAFT,
        PENDING_APPROVAL,  // Écart caisse/stock > seuil, en attente validation superviseur
        FINALIZED
    }
}
