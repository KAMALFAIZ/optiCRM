package com.opticrm.api.sage.entity;

import com.opticrm.security.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "sage_sync_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SageSyncRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "entity_type", nullable = false, length = 30)
    private String entityType;   // ACCOUNTS | CONTACTS | CA | OBJECTIVES

    @Column(length = 255)
    private String label;

    @Column(name = "source_format", length = 20)
    @Builder.Default
    private String sourceFormat = "CSV";

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";  // PENDING | PROCESSING | DONE | ERROR | CANCELLED

    @Column(name = "total_items")
    @Builder.Default
    private int totalItems = 0;

    @Column(name = "processed_items")
    @Builder.Default
    private int processedItems = 0;

    @Column(name = "success_items")
    @Builder.Default
    private int successItems = 0;

    @Column(name = "error_items")
    @Builder.Default
    private int errorItems = 0;

    @Column(name = "skip_items")
    @Builder.Default
    private int skipItems = 0;

    @Column(name = "period_year")
    private Integer periodYear;

    @Column(name = "period_month")
    private Integer periodMonth;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SageSyncItem> items = new ArrayList<>();
}
