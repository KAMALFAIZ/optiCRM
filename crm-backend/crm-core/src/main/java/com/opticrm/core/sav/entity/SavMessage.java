package com.opticrm.core.sav.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sav_messages")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SavMessage {

    @Id @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ticket", nullable = false)
    private SavTicket ticket;

    /** CLIENT / AGENT_IA / KAMAL */
    @Column(name = "expediteur", length = 20, nullable = false)
    private String expediteur;

    @Column(name = "contenu", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String contenu;

    @Column(name = "langue", length = 5)
    @Builder.Default
    private String langue = "FR";

    @Column(name = "canal", length = 20)
    @Builder.Default
    private String canal = "WEB";

    /** JSON: agent utilisé, score, durée traitement */
    @Column(name = "metadata_json", columnDefinition = "NVARCHAR(MAX)")
    private String metadataJson;

    @Column(name = "date_envoi", nullable = false)
    @Builder.Default
    private Instant dateEnvoi = Instant.now();

    @Column(name = "lu")
    @Builder.Default
    private Boolean lu = false;
}
