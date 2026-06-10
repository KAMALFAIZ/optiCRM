package com.opticrm.api.agent.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sage_export_queue")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SageExportQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "entity_type", nullable = false, length = 30)
    private String entityType;   // QUOTE | SALES_ORDER | DELIVERY | PAYMENT

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "sage_doc_type")
    private Integer sageDocType;  // 0=Devis, 1=BC, 3=BL, 6=Facture

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String action = "CREATE";  // CREATE | UPDATE | CANCEL

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";
    // PENDING | SENT | DONE | ERROR | RETRY | CANCELLED

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String payload;   // JSON snapshot du doc + lignes

    @Column(name = "sage_piece", length = 20)
    private String sagePiece;

    @Column(name = "error_message", columnDefinition = "NVARCHAR(MAX)")
    private String errorMessage;

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private int retryCount = 0;

    @Column(name = "max_retries", nullable = false)
    @Builder.Default
    private int maxRetries = 3;

    @Column(name = "created_by_id")
    private UUID createdById;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
