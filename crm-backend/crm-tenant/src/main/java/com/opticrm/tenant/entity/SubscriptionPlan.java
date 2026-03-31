package com.opticrm.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @Column(name = "id", length = 50)
    private String id; // FREE, STARTER, PRO, ENTERPRISE

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "price_monthly", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal priceMonthly = BigDecimal.ZERO;

    @Column(name = "price_yearly", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal priceYearly = BigDecimal.ZERO;

    /** -1 = unlimited */
    @Column(name = "max_users")
    @Builder.Default
    private Integer maxUsers = -1;

    /** -1 = unlimited */
    @Column(name = "max_accounts")
    @Builder.Default
    private Integer maxAccounts = -1;

    /** JSON: {"ai": true, "workflows": true, "api_access": false} */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "features", columnDefinition = "NVARCHAR(MAX)")
    private Map<String, Object> features;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
