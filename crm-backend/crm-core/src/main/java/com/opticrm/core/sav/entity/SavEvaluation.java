package com.opticrm.core.sav.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sav_evaluations")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SavEvaluation {

    @Id @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ticket", nullable = false, unique = true)
    private SavTicket ticket;

    /** 1 à 5 */
    @Column(name = "note")
    private Integer note;

    @Column(name = "commentaire", length = 500)
    private String commentaire;

    @Column(name = "date_evaluation", nullable = false)
    @Builder.Default
    private Instant dateEvaluation = Instant.now();
}
