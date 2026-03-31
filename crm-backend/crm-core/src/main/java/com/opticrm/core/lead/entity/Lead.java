package com.opticrm.core.lead.entity;

import com.opticrm.core.account.entity.Account;
import com.opticrm.core.contact.entity.Contact;
import com.opticrm.security.entity.Territory;
import com.opticrm.security.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.time.LocalDate;

@Entity
@Table(name = "leads")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Lead {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "salutation", length = 20)
    private String salutation;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "mobile", length = 20)
    private String mobile;

    @Column(name = "company_name", length = 255)
    private String companyName;

    @Column(name = "job_title", length = 100)
    private String jobTitle;

    @Column(name = "website", length = 255)
    private String website;

    // Address
    @Column(name = "street", length = 255)
    private String street;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "country", length = 100)
    private String country;

    // Lead Info
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "new";

    @Column(name = "source", length = 50)
    private String source;

    @Column(name = "source_details", length = 255)
    private String sourceDetails;

    @Column(name = "rating", length = 20)
    private String rating;

    @Column(name = "lead_score")
    @Builder.Default
    private Integer leadScore = 0;

    @Column(name = "interested_products", columnDefinition = "TEXT[]")
    private List<String> interestedProducts;

    @Column(name = "budget_range", length = 50)
    private String budgetRange;

    @Column(name = "decision_timeframe", length = 50)
    private String decisionTimeframe;

    // Champs avancés
    @Column(name = "fax", length = 20)
    private String fax;

    @Column(name = "linkedin_url", length = 255)
    private String linkedinUrl;

    @Column(name = "industry", length = 100)
    private String industry;

    @Column(name = "num_employees", length = 50)
    private String numEmployees;

    @Column(name = "annual_revenue", length = 50)
    private String annualRevenue;

    @Column(name = "priority", length = 20)
    private String priority;

    @Column(name = "do_not_call")
    @Builder.Default
    private Boolean doNotCall = false;

    @Column(name = "do_not_email")
    @Builder.Default
    private Boolean doNotEmail = false;

    @Column(name = "next_follow_up_date")
    private LocalDate nextFollowUpDate;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // Qualification avancée (V26)
    @Column(name = "qualification_notes", columnDefinition = "TEXT")
    private String qualificationNotes;

    @Column(name = "competitor", length = 200)
    private String competitor;

    @Column(name = "product_demo_requested")
    @Builder.Default
    private Boolean productDemoRequested = false;

    @Column(name = "meeting_scheduled_at")
    private Instant meetingScheduledAt;

    // Relations
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "territory_id")
    private Territory territory;

    @Column(name = "campaign_id")
    private UUID campaignId;

    // Conversion
    @Column(name = "is_converted")
    @Builder.Default
    private Boolean isConverted = false;

    @Column(name = "converted_at")
    private Instant convertedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "converted_contact_id")
    private Contact convertedContact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "converted_account_id")
    private Account convertedAccount;

    @Column(name = "converted_opportunity_id")
    private UUID convertedOpportunityId;

    // Optimistic locking
    @Version
    @Column(name = "version")
    private Long version;

    // Audit
    @CreatedBy
    @Column(name = "created_by_id", updatable = false)
    private UUID createdById;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "last_activity_at")
    private Instant lastActivityAt;

    // Helpers
    public String getFullName() {
        StringBuilder sb = new StringBuilder();
        if (salutation != null && !salutation.isEmpty()) {
            sb.append(salutation).append(" ");
        }
        if (firstName != null) {
            sb.append(firstName).append(" ");
        }
        sb.append(lastName);
        return sb.toString().trim();
    }

    public String getDisplayName() {
        if (firstName != null && !firstName.isEmpty()) {
            return firstName + " " + lastName;
        }
        return lastName;
    }

    public String getFullAddress() {
        StringBuilder sb = new StringBuilder();
        if (street != null) sb.append(street);
        if (postalCode != null || city != null) {
            if (sb.length() > 0) sb.append(", ");
            if (postalCode != null) sb.append(postalCode).append(" ");
            if (city != null) sb.append(city);
        }
        if (country != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(country);
        }
        return sb.toString();
    }
}
