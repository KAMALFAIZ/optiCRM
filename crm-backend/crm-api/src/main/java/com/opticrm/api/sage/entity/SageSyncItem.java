package com.opticrm.api.sage.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "sage_sync_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SageSyncItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private SageSyncRequest request;

    @Column(name = "row_index")
    private Integer rowIndex;

    @Column(name = "sage_ref", length = 100)
    private String sageRef;

    @Column(name = "crm_id")
    private UUID crmId;

    @Column(length = 20)
    private String action;   // CREATE | UPDATE | SKIP | ERROR

    @Column(length = 20)
    @Builder.Default
    private String status = "PENDING";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_data", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> rawData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "mapped_data", columnDefinition = "jsonb")
    private Map<String, Object> mappedData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "diff_data", columnDefinition = "jsonb")
    private Map<String, Object> diffData;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
