package com.opticrm.core.account.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Définition d'un champ libre (information libre) configurable par l'admin.
 * Chaque CustomField correspond à un champ que l'utilisateur peut remplir sur un compte.
 */
@Entity
@Table(name = "custom_fields")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomField {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Nom/libellé du champ affiché dans l'UI */
    @Column(name = "field_name", nullable = false, length = 100)
    private String fieldName;

    /** Clé technique unique (slug) */
    @Column(name = "field_key", nullable = false, unique = true, length = 100)
    private String fieldKey;

    /** Type de champ : TEXT, NUMBER, DATE, SELECT, BOOLEAN */
    @Column(name = "field_type", nullable = false, length = 20)
    private String fieldType;

    /** Options pour les champs SELECT (JSON array : ["Option1","Option2"]) */
    @Column(name = "field_options", columnDefinition = "NVARCHAR(MAX)")
    private String fieldOptions;

    /** Ordre d'affichage */
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    /** Champ obligatoire ? */
    @Column(name = "required", nullable = false)
    private boolean required;

    /** Actif / inactif */
    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
