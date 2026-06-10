package com.opticrm.stock.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "warehouses")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Warehouse {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "code", nullable = false, unique = true, length = 20)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "address_street", length = 255)
    private String addressStreet;

    @Column(name = "address_city", length = 100)
    private String addressCity;

    @Column(name = "address_postal_code", length = 20)
    private String addressPostalCode;

    @Column(name = "address_country", length = 100)
    private String addressCountry;

    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    // Helper method for full address
    public String getFullAddress() {
        StringBuilder sb = new StringBuilder();
        if (addressStreet != null) sb.append(addressStreet);
        if (addressPostalCode != null || addressCity != null) {
            if (sb.length() > 0) sb.append(", ");
            if (addressPostalCode != null) sb.append(addressPostalCode).append(" ");
            if (addressCity != null) sb.append(addressCity);
        }
        if (addressCountry != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(addressCountry);
        }
        return sb.toString();
    }
}
