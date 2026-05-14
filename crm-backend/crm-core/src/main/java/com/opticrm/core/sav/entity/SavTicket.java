package com.opticrm.core.sav.entity;

import com.opticrm.core.account.entity.Account;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "sav_tickets")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class SavTicket {

    @Id @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "numero_ticket", nullable = false, unique = true, length = 20)
    private String numeroTicket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    /** WEB / WHATSAPP / EMAIL */
    @Column(name = "canal_entree", length = 20)
    @Builder.Default
    private String canalEntree = "WEB";

    /** FR / AR */
    @Column(name = "langue_detectee", length = 5)
    @Builder.Default
    private String langueDetectee = "FR";

    @Column(name = "texte_original", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String texteOriginal;

    @Column(name = "texte_normalise", columnDefinition = "NVARCHAR(MAX)")
    private String texteNormalise;

    /** SAGE100_GC / SAGE100_PAIE / SAGE100_COMPTA / OPTICRM / OPTIBOARD / INFRA_SQL / ERPNEXT / AUTRE */
    @Column(name = "domaine", length = 30)
    private String domaine;

    /** BUG / QUESTION / CONFIG / FORMATION */
    @Column(name = "type_ticket", length = 20)
    private String typeTicket;

    /** P1 / P2 / P3 */
    @Column(name = "criticite", length = 5)
    private String criticite;

    @Column(name = "sla_heures")
    private Integer slaHeures;

    @Column(name = "sla_echeance")
    private Instant slaEcheance;

    /** OUVERT / EN_ANALYSE / EN_COURS / RESOLU / ESCALADE / FERME / ANNULE */
    @Column(name = "statut", length = 20, nullable = false)
    @Builder.Default
    private String statut = "OUVERT";

    @Column(name = "score_confiance")
    private Double scoreConfiance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_kb_article")
    private KbArticle kbArticle;

    @Column(name = "solution_proposee", columnDefinition = "NVARCHAR(MAX)")
    private String solutionProposee;

    /** FR / AR */
    @Column(name = "solution_langue", length = 5)
    private String solutionLangue;

    /** IA / KAMAL / CLIENT */
    @Column(name = "resolu_par", length = 20)
    private String resoluPar;

    @Column(name = "confirmed_resolution")
    @Builder.Default
    private Boolean confirmedResolution = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "date_prise_en_charge")
    private Instant datePriseEnCharge;

    @Column(name = "date_resolution")
    private Instant dateResolution;

    @Column(name = "date_fermeture")
    private Instant dateFermeture;

    @Column(name = "notes_internes", columnDefinition = "NVARCHAR(MAX)")
    private String notesInternes;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SavMessage> messages = new ArrayList<>();
}
