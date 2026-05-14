package com.opticrm.core.account.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reference_data",
       uniqueConstraints = @UniqueConstraint(columnNames = {"category", "value"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReferenceData {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Catégorie : CATEGORIE_CLIENT, SOCIETE_AFFECTATION, TYPE_COMPTE, TYPE_COMPTE_ODYSSEE */
    @Column(nullable = false, length = 50)
    private String category;

    /** Valeur stockée en base (ex: REVENDEUR, Prospect) */
    @Column(name = "ref_value", nullable = false, length = 100)
    private String value;

    /** Libellé affiché dans l'UI (ex: Revendeur spécialisé) */
    @Column(nullable = false, length = 150)
    private String label;

    /** Couleur optionnelle pour affichage (ex: blue, green) */
    @Column(length = 30)
    private String color;

    /** Ordre d'affichage */
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    /** Actif / inactif */
    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public ReferenceData(String category, String value, String label, String color, int sortOrder) {
        this.category = category;
        this.value = value;
        this.label = label;
        this.color = color;
        this.sortOrder = sortOrder;
        this.active = true;
    }
}
