package com.opticrm.communication.entity;

import com.opticrm.security.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Notification {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** Utilisateur destinataire */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Type : ACTIVITY, LEAD, OPPORTUNITY, VISIT, TOUR, SYSTEM … */
    @Column(name = "type", nullable = false, length = 50)
    private String type;

    /** Titre court affiché dans la cloche */
    @Column(name = "title", nullable = false, length = 255)
    private String title;

    /** Message complet */
    @Column(name = "message", length = 1000)
    private String message;

    /** Lien de navigation dans l'app (ex: /leads/uuid) */
    @Column(name = "link", length = 500)
    private String link;

    /** false = non lue, true = lue */
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
