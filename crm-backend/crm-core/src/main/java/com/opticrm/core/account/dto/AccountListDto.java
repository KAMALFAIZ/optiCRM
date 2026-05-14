package com.opticrm.core.account.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountListDto {

    private String id;
    private String name;
    private String logoUrl;
    private String accountType;
    private String segment;
    private String industryName;
    private String billingCity;
    private String billingCountry;
    private String phone;
    private String ice;
    private String sageCode;
    private String codeClientCrm;
    private String societeAffectation;
    private String website;
    private BigDecimal annualRevenue;
    private String assignedToName;
    private Integer contactCount;
    private Integer accountScore;

    // ODYSSÉE Distribution
    private String famille;
    private String typeCompteOdyssee;
    private String prefecture;
    private String statutCompte;
    private String potentiel;
    private String representant;
    private String categorieClient;
    private String secteurActivite;

    // GPS - pour la carte interactive
    private java.math.BigDecimal latitude;
    private java.math.BigDecimal longitude;
}
