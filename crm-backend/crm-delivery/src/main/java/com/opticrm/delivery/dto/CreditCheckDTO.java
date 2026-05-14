package com.opticrm.delivery.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditCheckDTO {
    private UUID customerId;
    private BigDecimal creditLimit;
    private BigDecimal outstanding;       // Crédit déjà utilisé
    private BigDecimal available;         // creditLimit - outstanding
    private BigDecimal requestedAmount;   // Montant demandé (si fourni)
    private boolean approved;            // Vente autorisée ?
    private String reason;               // Motif de refus si non approuvé
    private boolean hasOverdueCredit;    // Créance > seuil de jours
    private int oldestCreditDays;        // Âge de la plus ancienne créance (jours)
}
