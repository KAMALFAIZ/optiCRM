package com.opticrm.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "license_keys")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LicenseKey {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, columnDefinition = "UNIQUEIDENTIFIER")
    private UUID tenantId;

    /** SHA-256 hash of the signed license key payload */
    @Column(name = "key_hash", nullable = false, length = 500)
    private String keyHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private SubscriptionPlan plan;

    @Column(name = "max_users")
    @Builder.Default
    private Integer maxUsers = 10;

    @Column(name = "issued_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant issuedAt = Instant.now();

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    /** JSON: { version, features, notes } */
    @Column(name = "metadata", columnDefinition = "NVARCHAR(MAX)")
    private String metadata;

    public boolean isValid() {
        return revokedAt == null
                && (expiresAt == null || expiresAt.isAfter(Instant.now()));
    }
}
