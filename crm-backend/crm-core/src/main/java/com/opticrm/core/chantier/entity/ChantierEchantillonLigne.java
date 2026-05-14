package com.opticrm.core.chantier.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "chantier_echantillon_lignes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChantierEchantillonLigne {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "echantillon_id", nullable = false)
    private ChantierEchantillon echantillon;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "product_code", nullable = false, length = 50)
    private String productCode;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantite = 1;
}
