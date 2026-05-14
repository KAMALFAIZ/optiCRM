package com.opticrm.core.sav.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sav_escalades")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SavEscalade {

    @Id @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ticket", nullable = false)
    private SavTicket ticket;

    @Column(name = "raison_escalade", length = 500)
    private String raisonEscalade;

    @Column(name = "score_confiance")
    private Double scoreConfiance;

    @Column(name = "tentatives_ia_json", columnDefinition = "NVARCHAR(MAX)")
    private String tentativesIaJson;

    @Column(name = "dossier_complet", columnDefinition = "NVARCHAR(MAX)")
    private String dossierComplet;

    /** EN_ATTENTE / PRIS_EN_CHARGE / RESOLU */
    @Column(name = "statut", length = 20, nullable = false)
    @Builder.Default
    private String statut = "EN_ATTENTE";

    @Column(name = "notif_whatsapp_envoye")
    @Builder.Default
    private Boolean notifWhatsappEnvoye = false;

    @Column(name = "notif_dashboard_envoye")
    @Builder.Default
    private Boolean notifDashboardEnvoye = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "date_prise_en_charge")
    private Instant datePriseEnCharge;
}
