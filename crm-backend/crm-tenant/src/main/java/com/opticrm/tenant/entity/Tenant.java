package com.opticrm.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a tenant (customer organization) in the system.
 * This table does NOT have a tenant_id column — it IS the tenant registry.
 */
@Entity
@Table(name = "tenants",
        uniqueConstraints = @UniqueConstraint(name = "uq_tenants_slug", columnNames = "slug"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tenant {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** Subdomain identifier: "acme" → acme.opticrm.ma */
    @Column(name = "slug", nullable = false, length = 100)
    private String slug;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private TenantStatus status = TenantStatus.TRIAL;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private SubscriptionPlan plan;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    /** Hex color for white-labeling, e.g. #1890ff */
    @Column(name = "primary_color", length = 10)
    @Builder.Default
    private String primaryColor = "#1890ff";

    /** Optional custom domain (e.g. crm.acme.ma) */
    @Column(name = "custom_domain", length = 255)
    private String customDomain;

    // ── On-premise license fields ──────────────────────────────────────────

    @Column(name = "license_key", columnDefinition = "NVARCHAR(MAX)")
    private String licenseKey;

    @Column(name = "license_expires_at")
    private Instant licenseExpiresAt;

    @Column(name = "max_users")
    @Builder.Default
    private Integer maxUsers = -1;

    // ── SaaS billing fields ────────────────────────────────────────────────

    @Column(name = "stripe_customer_id", length = 100)
    private String stripeCustomerId;

    @Column(name = "stripe_subscription_id", length = 100)
    private String stripeSubscriptionId;

    @Column(name = "trial_ends_at")
    private Instant trialEndsAt;

    @Column(name = "admin_email", length = 255)
    private String adminEmail;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "ice", length = 30)
    private String ice;

    // ── Database provisioning (SaaS database-per-tenant) ──────────────────

    /** Nom de la base SQL Server : opticrm_{slug} */
    @Column(name = "db_name", length = 200)
    private String dbName;

    @Column(name = "db_provisioned", nullable = false)
    @Builder.Default
    private Boolean dbProvisioned = false;

    @Column(name = "db_provisioned_at")
    private Instant dbProvisionedAt;

    // ── Audit ──────────────────────────────────────────────────────────────

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public enum TenantStatus {
        TRIAL, ACTIVE, SUSPENDED, CANCELLED
    }
}
