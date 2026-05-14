package com.opticrm.security.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "territories")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Territory {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "region", length = 100)
    private String region;

    @Column(name = "country", length = 100)
    private String country;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "postal_codes", columnDefinition = "text[]")
    @Builder.Default
    private List<String> postalCodes = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_territory_id")
    private Territory parentTerritory;

    @OneToMany(mappedBy = "parentTerritory", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Territory> childTerritories = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
