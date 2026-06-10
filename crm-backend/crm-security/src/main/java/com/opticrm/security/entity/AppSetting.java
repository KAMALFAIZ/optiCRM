package com.opticrm.security.entity;

import com.opticrm.tenant.context.TenantContext;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "app_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppSetting {

    @Id
    @Column(name = "`key`")
    private String key;

    @Column(name = "`value`", columnDefinition = "NVARCHAR(MAX)")
    private String value;

    @Column(nullable = false)
    private String category;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public AppSetting(String key, String value, String category) {
        this.key = key;
        this.value = value;
        this.category = category;
    }

    @PrePersist
    private void prePersist() {
        if (this.tenantId == null) {
            UUID ctx = TenantContext.get();
            this.tenantId = ctx != null ? ctx : UUID.fromString("00000000-0000-0000-0000-000000000001");
        }
    }
}

