package com.opticrm.delivery.service;

import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.delivery.dto.CreditCheckDTO;
import com.opticrm.delivery.repository.DeliveryLineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class CreditCheckService {

    /** Seuil d'antériorité en jours au-delà duquel le crédit est bloqué */
    private static final int OVERDUE_BLOCK_DAYS = 60;

    private final AccountRepository accountRepository;
    private final DeliveryLineRepository deliveryLineRepository;

    /**
     * Évalue si une vente à crédit est autorisée pour ce client.
     * @param customerId  UUID du client
     * @param amount      Montant de la nouvelle vente (peut être null pour consultation simple)
     */
    public CreditCheckDTO check(UUID customerId, BigDecimal amount) {
        Optional<Account> accountOpt = accountRepository.findById(customerId);
        BigDecimal creditLimit = accountOpt.map(Account::getCreditLimit).orElse(BigDecimal.ZERO);
        BigDecimal outstanding = deliveryLineRepository.sumOutstandingCreditByCustomer(customerId);
        if (outstanding == null) outstanding = BigDecimal.ZERO;

        BigDecimal available = creditLimit.subtract(outstanding);
        BigDecimal requested = amount != null ? amount : BigDecimal.ZERO;

        // Vérifier l'antériorité des créances
        LocalDate cutoff = LocalDate.now().minusDays(OVERDUE_BLOCK_DAYS);
        boolean hasOverdue = deliveryLineRepository.hasOverdueCredit(customerId, cutoff);
        LocalDate oldestDate = deliveryLineRepository.oldestOutstandingCreditDate(customerId);
        int oldestDays = oldestDate != null
            ? (int) ChronoUnit.DAYS.between(oldestDate, LocalDate.now())
            : 0;

        boolean approved = true;
        String reason = null;

        if (hasOverdue) {
            approved = false;
            reason = "Client bloqué : créance en souffrance depuis " + oldestDays +
                     " jours (seuil : " + OVERDUE_BLOCK_DAYS + " jours)";
        } else if (creditLimit.compareTo(BigDecimal.ZERO) > 0 && requested.compareTo(BigDecimal.ZERO) > 0) {
            if (outstanding.add(requested).compareTo(creditLimit) > 0) {
                approved = false;
                reason = "Plafond de crédit dépassé : encours=" + outstanding +
                         " + demandé=" + requested + " > limite=" + creditLimit;
            }
        }

        return CreditCheckDTO.builder()
            .customerId(customerId)
            .creditLimit(creditLimit)
            .outstanding(outstanding)
            .available(available)
            .requestedAmount(requested)
            .approved(approved)
            .reason(reason)
            .hasOverdueCredit(hasOverdue)
            .oldestCreditDays(oldestDays)
            .build();
    }
}
