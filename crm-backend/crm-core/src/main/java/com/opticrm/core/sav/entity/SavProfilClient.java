package com.opticrm.core.sav.entity;

import com.opticrm.core.account.entity.Account;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sav_profil_client")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class SavProfilClient {

    @Id @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false, unique = true)
    private Account account;

    /** DEBUTANT / INTERMEDIAIRE / EXPERT */
    @Column(name = "niveau_technique", length = 20, nullable = false)
    @Builder.Default
    private String niveauTechnique = "INTERMEDIAIRE";

    /** FR / AR / BOTH */
    @Column(name = "langue_preferee", length = 10, nullable = false)
    @Builder.Default
    private String languePreferee = "FR";

    /** JSON: ["SAGE100_GC","SAGE100_PAIE"] */
    @Column(name = "produits_json", columnDefinition = "NVARCHAR(MAX)")
    private String produitsJson;

    /** JSON: {"os":"WS2019","sage_version":"v9","users":8} */
    @Column(name = "environnement_json", columnDefinition = "NVARCHAR(MAX)")
    private String environnementJson;

    /** JSON: {"horaires":"9h-18h","canal_prefere":"WHATSAPP"} */
    @Column(name = "preferences_json", columnDefinition = "NVARCHAR(MAX)")
    private String preferencesJson;

    @Column(name = "tel_whatsapp", length = 20)
    private String telWhatsapp;

    @Column(name = "email_contact", length = 200)
    private String emailContact;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
