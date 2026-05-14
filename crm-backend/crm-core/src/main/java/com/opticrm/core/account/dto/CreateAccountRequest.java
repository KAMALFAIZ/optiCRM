package com.opticrm.core.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAccountRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    private String name;

    @Size(max = 255, message = "Legal name must not exceed 255 characters")
    private String legalName;

    // Code client CRM interne (référence propre à OptiCRM)
    @Size(max = 50, message = "Code client CRM must not exceed 50 characters")
    private String codeClientCrm;

    // Société d'affectation
    @Size(max = 100)
    private String societeAffectation;

    // Identification Maroc
    @Size(max = 30)
    private String ice;

    @Size(max = 50)
    private String identifiantFiscal;

    @Size(max = 50)
    private String rc;

    @Size(max = 50)
    private String cnss;

    @Size(max = 50)
    private String patente;

    private BigDecimal capitalSocial;

    private String associes;

    // Identification France / Legacy
    @Size(max = 14, message = "SIRET must not exceed 14 characters")
    private String siret;

    @Size(max = 9, message = "SIREN must not exceed 9 characters")
    private String siren;

    @Size(max = 20, message = "VAT number must not exceed 20 characters")
    private String vatNumber;

    // Classification Sage
    @Size(max = 100)
    private String secteurActivite;

    @Size(max = 50)
    private String categorieClient;

    // Classification
    @NotBlank(message = "Account type is required")
    @Size(max = 50, message = "Account type must not exceed 50 characters")
    private String accountType;

    private String industryId;
    private Integer employeeCount;
    private BigDecimal annualRevenue;

    @Size(max = 3, message = "Currency must be 3 characters")
    private String revenueCurrency;

    // Billing Address
    @Size(max = 255, message = "Street must not exceed 255 characters")
    private String billingStreet;

    @Size(max = 100, message = "City must not exceed 100 characters")
    private String billingCity;

    @Size(max = 100, message = "State must not exceed 100 characters")
    private String billingState;

    @Size(max = 20, message = "Postal code must not exceed 20 characters")
    private String billingPostalCode;

    @Size(max = 100, message = "Country must not exceed 100 characters")
    private String billingCountry;

    // Shipping Address
    @Size(max = 255, message = "Street must not exceed 255 characters")
    private String shippingStreet;

    @Size(max = 100, message = "City must not exceed 100 characters")
    private String shippingCity;

    @Size(max = 100, message = "State must not exceed 100 characters")
    private String shippingState;

    @Size(max = 20, message = "Postal code must not exceed 20 characters")
    private String shippingPostalCode;

    @Size(max = 100, message = "Country must not exceed 100 characters")
    private String shippingCountry;

    // GPS - Localisation
    private java.math.BigDecimal latitude;
    private java.math.BigDecimal longitude;

    // Contact Info
    @Size(max = 255, message = "Website must not exceed 255 characters")
    private String website;

    @Size(max = 20, message = "Phone must not exceed 20 characters")
    private String phone;

    @Size(max = 50, message = "WhatsApp must not exceed 50 characters")
    private String whatsapp;

    // Scoring
    @Size(max = 50, message = "Segment must not exceed 50 characters")
    private String segment;

    private List<String> tags;

    // ODYSSÉE Distribution
    // famille : "DISTRIBUTION"
    @Size(max = 50)
    private String famille;

    // REVENDEUR_SPECIALISE | INSTALLATEUR_PLOMBIER | SHOWROOM | DISTRIBUTEUR_BTP | CANAL_MODERNE | AUTRE
    @Size(max = 50)
    private String typeCompteOdyssee;

    @Size(max = 100)
    private String prefecture;

    // ACHETEUR | PRESCRIPTEUR | MIXTE
    @Size(max = 30)
    private String rolePrincipal;

    // ACTIF | A_DEVELOPPER | INACTIF
    @Size(max = 30)
    private String statutCompte;

    // FAIBLE | MOYEN | FORT
    @Size(max = 20)
    private String potentiel;

    @Size(max = 150)
    private String representant;

    @Size(max = 500)
    private String actionSuivante;

    private LocalDate dateProchaineAction;

    // Finance
    private BigDecimal creditLimit;
    private BigDecimal insuranceAmount;
    private String insuranceCompany;
    private String paymentTermsId;

    // Relations
    private String parentAccountId;
    private String assignedToId;
    private String territoryId;

    // Tarification
    private String pricingCategoryId;
}
