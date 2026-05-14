package com.opticrm.core.chantier.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chantier_acteurs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChantierActeur {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chantier_id", nullable = false)
    private Chantier chantier;

    // PROMOTEUR | ARCHITECTE | BUREAU_ETUDES | ENTREPRISE_GENERALE | INSTALLATEUR_PLOMBIER
    @Column(name = "role_acteur", nullable = false, length = 30)
    private String roleActeur;

    @Column(name = "nom", nullable = false, length = 255)
    private String nom;

    @Column(name = "telephone", length = 20)
    private String telephone;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
