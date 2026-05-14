package com.opticrm.core.account.service;

import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.account.dto.HealthScoreDto;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.opportunity.repository.OpportunityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Calcule et persiste le Score Santé Client (0-100) pour un compte.
 *
 * Formule :
 *   Engagement pipeline  → 0-35 pts
 *   Taux de conversion   → 0-30 pts
 *   Revenu gagné         → 0-20 pts
 *   Complétude profil    → 0-15 pts
 *   ─────────────────────────────
 *   TOTAL                → 0-100 pts
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HealthScoreService {

    private final AccountRepository accountRepository;
    private final OpportunityRepository opportunityRepository;

    // ─── Calcul dynamique (lecture seule) ────────────────────────────────────

    @Transactional(readOnly = true)
    public HealthScoreDto compute(UUID accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", accountId));

        return buildScore(account);
    }

    // ─── Calcul + persistance dans account_score ──────────────────────────────

    @Transactional
    public HealthScoreDto computeAndPersist(UUID accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", accountId));

        HealthScoreDto dto = buildScore(account);
        account.setAccountScore(dto.getScore());
        accountRepository.save(account);

        log.info("Score Santé rafraîchi pour account {} : {}/100 ({})", accountId, dto.getScore(), dto.getLabel());
        return dto;
    }

    // ─── Logique privée ───────────────────────────────────────────────────────

    private HealthScoreDto buildScore(Account account) {
        UUID accountId = account.getId();

        // ── Signaux opportunités ─────────────────────────────────────────────
        long totalOpps   = opportunityRepository.countByAccountId(accountId);
        long openOpps    = opportunityRepository.countOpenByAccountId(accountId);
        long wonOpps     = opportunityRepository.countWonByAccountId(accountId);
        BigDecimal wonRevenue   = nullSafe(opportunityRepository.sumWonAmountByAccountId(accountId));
        BigDecimal openPipeline = nullSafe(opportunityRepository.sumOpenPipelineByAccountId(accountId));

        // ── 1. Engagement pipeline (0-35) ────────────────────────────────────
        int engagement = 0;
        if (openOpps >= 4)      engagement += 25;
        else if (openOpps >= 2) engagement += 20;
        else if (openOpps == 1) engagement += 10;

        // Bonus : pipeline avec montant réel
        if (openOpps > 0 && openPipeline.compareTo(BigDecimal.ZERO) > 0) {
            engagement += 10;
        }
        engagement = Math.min(engagement, 35);

        // ── 2. Taux de conversion (0-30) ─────────────────────────────────────
        double winRate = 0.0;
        int conversion = 0;
        if (totalOpps > 0) {
            winRate = (double) wonOpps / totalOpps;
            if      (winRate >= 0.70) conversion = 30;
            else if (winRate >= 0.50) conversion = 22;
            else if (winRate >= 0.30) conversion = 14;
            else if (winRate >  0.0)  conversion = 7;
        }

        // ── 3. Revenu gagné (0-20) ───────────────────────────────────────────
        double wonRevenueD = wonRevenue.doubleValue();
        int revenue;
        if      (wonRevenueD >= 500_000) revenue = 20;
        else if (wonRevenueD >= 200_000) revenue = 15;
        else if (wonRevenueD >=  50_000) revenue = 10;
        else if (wonRevenueD >   0)      revenue = 5;
        else                             revenue = 0;

        // ── 4. Complétude profil (0-15) ──────────────────────────────────────
        boolean hasPhone    = notBlank(account.getPhone());
        boolean hasWebsite  = notBlank(account.getWebsite());
        boolean hasCity     = notBlank(account.getBillingCity());
        boolean hasIndustry = account.getIndustry() != null;
        boolean hasSegment  = notBlank(account.getSegment());

        int profile = (hasPhone    ? 3 : 0)
                    + (hasWebsite  ? 3 : 0)
                    + (hasCity     ? 3 : 0)
                    + (hasIndustry ? 3 : 0)
                    + (hasSegment  ? 3 : 0);

        // ── Score total ──────────────────────────────────────────────────────
        int score = Math.max(0, Math.min(100, engagement + conversion + revenue + profile));

        // ── Label et couleur ─────────────────────────────────────────────────
        String label, color;
        if      (score >= 80) { label = "Excellent"; color = "#52c41a"; }
        else if (score >= 60) { label = "Bon";       color = "#73d13d"; }
        else if (score >= 40) { label = "Moyen";     color = "#faad14"; }
        else if (score >= 20) { label = "Faible";    color = "#ff7a45"; }
        else                  { label = "Critique";  color = "#ff4d4f"; }

        return HealthScoreDto.builder()
                .score(score)
                .label(label)
                .color(color)
                .breakdown(HealthScoreDto.Breakdown.builder()
                        .engagement(engagement)
                        .conversion(conversion)
                        .revenue(revenue)
                        .profile(profile)
                        .openOpportunities(openOpps)
                        .wonOpportunities(wonOpps)
                        .totalOpportunities(totalOpps)
                        .winRate(Math.round(winRate * 1000.0) / 10.0)  // 0.0-100.0
                        .wonRevenue(wonRevenue)
                        .openPipeline(openPipeline)
                        .hasPhone(hasPhone)
                        .hasWebsite(hasWebsite)
                        .hasBillingCity(hasCity)
                        .hasIndustry(hasIndustry)
                        .hasSegment(hasSegment)
                        .build())
                .build();
    }

    private static BigDecimal nullSafe(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
