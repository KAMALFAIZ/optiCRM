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
 * Valeur d'un champ libre pour un compte donné.
 */
@Entity
@Table(name = "custom_field_values",
       uniqueConstraints = @UniqueConstraint(columnNames = {"account_id", "field_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomFieldValue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "field_id", nullable = false)
    private UUID fieldId;

    /** Valeur stockée sous forme texte (conversion côté frontend selon le type) */
    @Column(name = "field_value", columnDefinition = "NVARCHAR(MAX)")
    private String fieldValue;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
