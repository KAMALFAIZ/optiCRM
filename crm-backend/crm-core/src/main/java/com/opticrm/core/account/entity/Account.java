package com.opticrm.core.account.entity;

import com.opticrm.common.util.StringListConverter;
import com.opticrm.security.entity.Territory;
import com.opticrm.security.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "accounts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Account {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "legal_name", length = 255)
    private String legalName;

    // Identification - Maroc
    @Column(name = "ice", length = 30)
    private String ice; // Identifiant Commun Entreprise (15 chiffres, étendu à 30 pour données Sage)

    @Column(name = "identifiant_fiscal", length = 50)
    private String identifiantFiscal; // IF - Identifiant Fiscal

    @Column(name = "rc", length = 50)
    private String rc; // Registre de Commerce

    @Column(name = "cnss", length = 50)
    private String cnss; // Numéro CNSS

    @Column(name = "patente", length = 50)
    private String patente; // Numéro de Patente

    @Column(name = "capital_social", precision = 18, scale = 2)
    private java.math.BigDecimal capitalSocial; // Capital social

    @Column(name = "associes", columnDefinition = "NVARCHAR(MAX)")
    private String associes; // Associés / actionnaires (texte libre)

    // Code client CRM interne (référence propre à OptiCRM)
    @Column(name = "code_client_crm", length = 50, unique = true)
    private String codeClientCrm;

    // Société d'affectation (ex : Sanitaire AL Boughaze, Odyssée)
    @Column(name = "societe_affectation", length = 100)
    private String societeAffectation;

    // Sage 100 integration
    @Column(name = "sage_code", length = 50)
    private String sageCode; // CT_Num Sage (clé de jointure)

    @Column(name = "sage_synced_at")
    private java.time.Instant sageSyncedAt;

    // Identification - Legacy (pour compatibilité)
    @Column(name = "siret", length = 30)
    private String siret;

    @Column(name = "siren", length = 20)
    private String siren;

    @Column(name = "vat_number", length = 50)
    private String vatNumber;

    // Classification
    @Column(name = "account_type", nullable = false, length = 50)
    private String accountType; // Prospect, Client, Partenaire, Fournisseur

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "industry_id")
    private Industry industry;

    @Column(name = "employee_count")
    private Integer employeeCount;

    @Column(name = "annual_revenue", precision = 15, scale = 2)
    private BigDecimal annualRevenue;

    @Column(name = "revenue_currency", length = 3)
    @Builder.Default
    private String revenueCurrency = "MAD";

    // Billing Address
    @Column(name = "billing_street", length = 255)
    private String billingStreet;

    @Column(name = "billing_city", length = 100)
    private String billingCity;

    @Column(name = "billing_state", length = 100)
    private String billingState;

    @Column(name = "billing_postal_code", length = 30)
    private String billingPostalCode;

    @Column(name = "billing_country", length = 100)
    private String billingCountry;

    // Shipping Address
    @Column(name = "shipping_street", length = 255)
    private String shippingStreet;

    @Column(name = "shipping_city", length = 100)
    private String shippingCity;

    @Column(name = "shipping_state", length = 100)
    private String shippingState;

    @Column(name = "shipping_postal_code", length = 30)
    private String shippingPostalCode;

    @Column(name = "shipping_country", length = 100)
    private String shippingCountry;

    // GPS - Localisation du siège / adresse de facturation
    @Column(name = "latitude", precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 11, scale = 8)
    private BigDecimal longitude;

    // Logo & Galerie photos
    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AccountPhoto> photos = new ArrayList<>();

    // Contact Info
    @Column(name = "website", length = 255)
    private String website;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "whatsapp", length = 50)
    private String whatsapp;

    // Scoring & Segmentation
    @Column(name = "account_score")
    @Builder.Default
    private Integer accountScore = 0;

    @Column(name = "segment", length = 50)
    private String segment;

    // Classification Sage 100C
    @Column(name = "secteur_activite", length = 100)
    private String secteurActivite; // Sage : [Secteur_]

    @Column(name = "categorie_client", length = 100)
    private String categorieClient; // Sage : [Catégorie_]

    @Column(name = "categorie_tarifaire", length = 100)
    private String categorieTarifaire; // Sage : [Catégorie tarifaire_]

    @Column(name = "representant", length = 150)
    private String representant; // Sage : [Représentant_]

    // ODYSSÉE Distribution
    // famille : "DISTRIBUTION" (discriminateur ODYSSÉE)
    @Column(name = "famille", length = 50)
    private String famille;

    // typeCompteOdyssee : REVENDEUR_SPECIALISE | INSTALLATEUR_PLOMBIER | SHOWROOM | DISTRIBUTEUR_BTP | CANAL_MODERNE | AUTRE
    @Column(name = "type_compte_odyssee", length = 100)
    private String typeCompteOdyssee; // Sage : [Type de compte ODYSSÉE_]

    @Column(name = "prefecture", length = 100)
    private String prefecture; // Sage : [Préfecture_]

    // rolePrincipal : ACHETEUR | PRESCRIPTEUR | MIXTE
    @Column(name = "role_principal", length = 30)
    private String rolePrincipal;

    // statutCompte : ACTIF | A_DEVELOPPER | INACTIF
    @Column(name = "statut_compte", length = 100)
    private String statutCompte; // Sage : [Statut_]

    // potentiel : FAIBLE | MOYEN | FORT
    @Column(name = "potentiel", length = 50)
    private String potentiel;

    @Column(name = "action_suivante", length = 500)
    private String actionSuivante;

    @Column(name = "date_prochaine_action")
    private LocalDate dateProchaineAction;

    @Convert(converter = StringListConverter.class)
    @Column(name = "tags", columnDefinition = "NVARCHAR(MAX)")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    // Finance
    @Column(name = "credit_limit", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal creditLimit = BigDecimal.ZERO;

    @Column(name = "insurance_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal insuranceAmount = BigDecimal.ZERO;

    @Column(name = "insurance_company", length = 255)
    private String insuranceCompany;

    @Column(name = "payment_terms_id")
    private UUID paymentTermsId;

    // Tarification
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pricing_category_id")
    private PricingCategory pricingCategory;

    // Relations
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_account_id")
    private Account parentAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "territory_id")
    private Territory territory;

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
    public String getFullBillingAddress() {
        StringBuilder sb = new StringBuilder();
        if (billingStreet != null) sb.append(billingStreet);
        if (billingPostalCode != null || billingCity != null) {
            if (sb.length() > 0) sb.append(", ");
            if (billingPostalCode != null) sb.append(billingPostalCode).append(" ");
            if (billingCity != null) sb.append(billingCity);
        }
        if (billingCountry != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(billingCountry);
        }
        return sb.toString();
    }
}
