package com.opticrm.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class AgedBalanceDto {

    private String accountId;
    private String accountName;
    private String commercialId;
    private String commercialName;

    /** Montant non encore échu (due_date >= aujourd'hui) */
    private BigDecimal nonEchu;

    /** Retard 1 à 30 jours */
    private BigDecimal echu1a30;

    /** Retard 31 à 60 jours */
    private BigDecimal echu31a60;

    /** Retard 61 à 90 jours */
    private BigDecimal echu61a90;

    /** Retard de plus de 90 jours */
    private BigDecimal echu91plus;

    /** Total dû (somme de toutes les tranches) */
    private BigDecimal totalDue;

    /** Nombre de factures ouvertes */
    private Long invoiceCount;
}
