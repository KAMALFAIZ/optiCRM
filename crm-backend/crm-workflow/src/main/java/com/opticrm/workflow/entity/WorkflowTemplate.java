package com.opticrm.workflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Template de workflow prédéfini.
 * Contient la structure complète (étapes + transitions) sérialisée en JSON.
 * Les templates système (isSystem=true) ne peuvent pas être modifiés/supprimés.
 */
@Entity
@Table(name = "workflow_templates")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class WorkflowTemplate {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** Nom affiché dans la galerie */
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    /** Description courte affichée dans la card */
    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    /** Catégorie : Lead Management, Sales, Field Operations, Client Service... */
    @Column(name = "category", nullable = false, length = 100)
    private String category;

    /** Icône (emoji ou nom d'icône Ant Design) */
    @Column(name = "icon", length = 100)
    private String icon;

    /** Type d'entité : LEAD, OPPORTUNITY, ACCOUNT, CONTACT, QUOTE, VISIT, TICKET */
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    /** Type de déclencheur : ENTITY_CREATED, FIELD_CHANGED, STATUS_CHANGED, SCORE_REACHED, CRON, MANUAL */
    @Column(name = "trigger_type", nullable = false, length = 50)
    private String triggerType;

    /** JSON config du déclencheur */
    @Column(name = "trigger_config", columnDefinition = "NVARCHAR(MAX)")
    private String triggerConfig;

    /**
     * JSON array des étapes :
     * [{name, stepType, actionConfig, stepOrder, isEntryPoint, positionX, positionY}, ...]
     */
    @Column(name = "steps_config", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String stepsConfig;

    /**
     * JSON array des transitions :
     * [{fromStepIndex, toStepIndex, label, conditionExpression, evalOrder}, ...]
     */
    @Column(name = "transitions_config", columnDefinition = "NVARCHAR(MAX)")
    private String transitionsConfig;

    /** Tags séparés par virgule (pour la recherche) : "lead,nurturing,email" */
    @Column(name = "tags", length = 500)
    private String tags;

    /** true = template système non modifiable par les utilisateurs */
    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private Boolean isSystem = true;

    /** Nombre de fois où ce template a été utilisé */
    @Column(name = "usage_count", nullable = false)
    @Builder.Default
    private Integer usageCount = 0;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
