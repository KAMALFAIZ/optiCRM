package com.opticrm.core.contact.entity;

import com.opticrm.core.account.entity.Account;
import com.opticrm.security.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "contacts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Contact {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "salutation", length = 20)
    private String salutation; // M., Mme, Dr., etc.

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone_mobile", length = 20)
    private String phoneMobile;

    @Column(name = "phone_office", length = 20)
    private String phoneOffice;

    @Column(name = "job_title", length = 100)
    private String jobTitle;

    @Column(name = "department", length = 100)
    private String department;

    // Address
    @Column(name = "address_street", length = 255)
    private String addressStreet;

    @Column(name = "address_city", length = 100)
    private String addressCity;

    @Column(name = "address_state", length = 100)
    private String addressState;

    @Column(name = "address_postal_code", length = 20)
    private String addressPostalCode;

    @Column(name = "address_country", length = 100)
    private String addressCountry;

    // Social Media
    @Column(name = "linkedin_url", length = 255)
    private String linkedinUrl;

    @Column(name = "twitter_handle", length = 100)
    private String twitterHandle;

    // Metadata
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "preferred_language", length = 10)
    @Builder.Default
    private String preferredLanguage = "fr";

    @Column(name = "do_not_call")
    @Builder.Default
    private Boolean doNotCall = false;

    @Column(name = "do_not_email")
    @Builder.Default
    private Boolean doNotEmail = false;

    // Relations
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(name = "contact_role", length = 50)
    private String contactRole; // Décideur, Influenceur, Utilisateur, etc.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reports_to_id")
    private Contact reportsTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    // Sage 100 integration
    @Column(name = "sage_contact_no")
    private Integer sageContactNo;

    @Column(name = "sage_synced_at")
    private Instant sageSyncedAt;

    @CreatedBy
    @Column(name = "created_by_id", updatable = false)
    private UUID createdById;

    // Optimistic locking
    @Version
    @Column(name = "version")
    private Long version;

    // Audit
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    // Helpers
    public String getFullName() {
        StringBuilder sb = new StringBuilder();
        if (salutation != null && !salutation.isEmpty()) {
            sb.append(salutation).append(" ");
        }
        sb.append(firstName).append(" ").append(lastName);
        return sb.toString().trim();
    }

    public String getDisplayName() {
        return firstName + " " + lastName;
    }

    public String getFullAddress() {
        StringBuilder sb = new StringBuilder();
        if (addressStreet != null) sb.append(addressStreet);
        if (addressPostalCode != null || addressCity != null) {
            if (sb.length() > 0) sb.append(", ");
            if (addressPostalCode != null) sb.append(addressPostalCode).append(" ");
            if (addressCity != null) sb.append(addressCity);
        }
        if (addressCountry != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(addressCountry);
        }
        return sb.toString();
    }
}
