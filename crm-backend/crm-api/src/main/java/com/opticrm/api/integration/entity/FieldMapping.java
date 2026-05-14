package com.opticrm.api.integration.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "field_mappings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldMapping {

    @Id
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "champ_source", nullable = false, unique = true, length = 100)
    private String champSource;

    @Column(name = "champ_opticrm", nullable = false, length = 100)
    private String champOpticrm;

    @Column(name = "actif", nullable = false)
    @Builder.Default
    private boolean actif = true;

    /** Entité cible : ACCOUNTS ou PRODUCTS */
    @Column(name = "entity_type", nullable = false, length = 30)
    @Builder.Default
    private String entityType = "ACCOUNTS";

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
