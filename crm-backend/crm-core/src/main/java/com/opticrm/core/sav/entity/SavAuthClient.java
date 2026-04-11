package com.opticrm.core.sav.entity;

import com.opticrm.core.account.entity.Account;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sav_auth_clients")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SavAuthClient {

    @Id @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "tel_whatsapp", length = 20, nullable = false, unique = true)
    private String telWhatsapp;

    @Column(name = "otp_code", length = 6)
    private String otpCode;

    @Column(name = "otp_expiration")
    private Instant otpExpiration;

    @Column(name = "otp_utilise")
    @Builder.Default
    private Boolean otpUtilise = false;

    @Column(name = "session_token", length = 255)
    private String sessionToken;

    @Column(name = "session_expiration")
    private Instant sessionExpiration;

    @Column(name = "derniere_connexion")
    private Instant derniereConnexion;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
