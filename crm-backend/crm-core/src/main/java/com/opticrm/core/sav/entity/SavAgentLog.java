package com.opticrm.core.sav.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sav_agent_logs")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SavAgentLog {

    @Id @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ticket", nullable = false)
    private SavTicket ticket;

    /** RECEPTIONNISTE / CLASSIFICATEUR / SPECIALISTE / DIAGNOSTIQUEUR / RESOLVER / ESCALADEUR */
    @Column(name = "agent_nom", length = 50, nullable = false)
    private String agentNom;

    /** DEBUT / SUCCES / ERREUR / TIMEOUT */
    @Column(name = "statut", length = 20)
    private String statut;

    @Column(name = "input_json", columnDefinition = "NVARCHAR(MAX)")
    private String inputJson;

    @Column(name = "output_json", columnDefinition = "NVARCHAR(MAX)")
    private String outputJson;

    @Column(name = "tokens_utilises")
    private Integer tokensUtilises;

    @Column(name = "duree_ms")
    private Integer dureeMs;

    @Column(name = "erreur_message", columnDefinition = "NVARCHAR(MAX)")
    private String erreurMessage;

    @Column(name = "date_execution", nullable = false)
    @Builder.Default
    private Instant dateExecution = Instant.now();
}
