package com.opticrm.common.util;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.TenantId;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /**
     * Tenant discriminator for multi-tenancy.
     * Hibernate 6 automatically filters queries and sets this on INSERT
     * using the CurrentTenantIdentifierResolver.
     */
    @TenantId
    @Column(name = "tenant_id", updatable = false, columnDefinition = "UNIQUEIDENTIFIER")
    private UUID tenantId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @CreatedBy
    @Column(name = "created_by_id", updatable = false)
    private UUID createdById;

    @LastModifiedBy
    @Column(name = "updated_by_id")
    private UUID updatedById;

    @Version
    @Column(name = "version")
    private Long version;
}
