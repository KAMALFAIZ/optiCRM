package com.opticrm.core.account.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AccountDto {

    private String id;
    private String name;
    private String legalName;

    // Code client CRM interne
    private String codeClientCrm;

    // Société d'affectation
    private String societeAffectation;

    // Identification - Maroc
    private String ice; // Identifiant Commun Entreprise
    private String identifiantFiscal; // IF
    private String rc; // Registre de Commerce
    private String cnss; // Numéro CNSS
    private String patente; // Numéro de Patente
    private java.math.BigDecimal capitalSocial; // Capital social
    private String associes; // Associés / actionnaires

    // Identification - Legacy
    private String siret;
    private String siren;
    private String vatNumber;

    // Classification
    private String accountType;
    private IndustrySummary industry;
    private Integer employeeCount;
    private BigDecimal annualRevenue;
    private String revenueCurrency;

    // Billing Address
    private String billingStreet;
    private String billingCity;
    private String billingState;
    private String billingPostalCode;
    private String billingCountry;
    private String fullBillingAddress;

    // Shipping Address
    private String shippingStreet;
    private String shippingCity;
    private String shippingState;
    private String shippingPostalCode;
    private String shippingCountry;

    // GPS
    private java.math.BigDecimal latitude;
    private java.math.BigDecimal longitude;

    // Logo & Galerie photos
    private String logoUrl;
    private List<AccountPhotoDto> photos;

    // Contact Info
    private String website;
    private String phone;
    private String whatsapp;

    // Scoring
    private Integer accountScore;
    private String segment;
    private List<String> tags;

    // Classification Sage 100C
    private String secteurActivite;
    private String categorieClient;
    private String categorieTarifaire;
    private String representant;

    // ODYSSÉE Distribution
    private String famille;
    private String typeCompteOdyssee;
    private String prefecture;
    private String rolePrincipal;
    private String statutCompte;
    private String potentiel;
    private String actionSuivante;
    private LocalDate dateProchaineAction;

    // Finance
    private BigDecimal creditLimit;
    private BigDecimal insuranceAmount;
    private String insuranceCompany;
    private String paymentTermsId;

    // Tarification
    private PricingCategorySummary pricingCategory;

    // Relations
    private AccountSummary parentAccount;
    private UserSummary assignedTo;
    private TerritorySummary territory;

    // Stats
    private Integer contactCount;

    // Optimistic locking
    private Long version;

    // Audit
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IndustrySummary {
        private String id;
        private String code;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccountSummary {
        private String id;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private String id;
        private String fullName;
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TerritorySummary {
        private String id;
        private String name;
        private String region;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PricingCategorySummary {
        private String id;
        private String code;
        private String name;
        private Boolean isDefault;
    }
}
