package com.opticrm.core.googlecalendar.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "google_calendar_credentials")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
public class GoogleCalendarCredential {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "access_token", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String accessToken;

    @Column(name = "refresh_token", columnDefinition = "NVARCHAR(MAX)")
    private String refreshToken;

    @Column(name = "token_expiry")
    private Long tokenExpiry;

    @Column(name = "google_email")
    private String googleEmail;

    @Column(name = "calendar_id")
    private String calendarId = "primary";

    @Column(name = "sync_enabled")
    private Boolean syncEnabled = true;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
