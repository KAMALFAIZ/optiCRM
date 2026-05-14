package com.opticrm.delivery.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_trail", indexes = {
    @Index(name = "idx_entity", columnList = "entity_type,entity_id"),
    @Index(name = "idx_when", columnList = "when_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditTrail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(name = "who_user_id")
    private UUID whoUserId;

    @Column(name = "what_changed", length = 500)
    private String whatChanged;

    @Column(name = "when_date", nullable = false)
    private LocalDateTime whenDate;

    @Column(name = "where_location")
    private String whereLocation;

    @Column(name = "why_reason")
    private String whyReason;
}
