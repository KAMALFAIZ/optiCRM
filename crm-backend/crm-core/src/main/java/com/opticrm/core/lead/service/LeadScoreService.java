package com.opticrm.core.lead.service;

import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.lead.dto.LeadScoreDto;
import com.opticrm.core.lead.entity.Lead;
import com.opticrm.core.lead.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Calcule et persiste le Score de Qualification d'un lead (0-100).
 *
 * Formule :
 *   Profil         → 0-35 pts  (coordonnées + entreprise)
 *   Qualification  → 0-40 pts  (budget, délai, produits, secteur)
 *   Engagement     → 0-25 pts  (statut + température)
 *   ──────────────────────────
 *   TOTAL          → 0-100 pts
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LeadScoreService {

    private final LeadRepository leadRepository;

    // ─── Calcul dynamique (lecture seule) ────────────────────────────────────

    @Transactional(readOnly = true)
    public LeadScoreDto compute(UUID leadId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead", leadId));
        return buildScore(lead);
    }

    // ─── Calcul + persistance dans lead_score ────────────────────────────────

    @Transactional
    public LeadScoreDto computeAndPersist(UUID leadId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead", leadId));

        LeadScoreDto dto = buildScore(lead);
        lead.setLeadScore(dto.getScore());
        leadRepository.save(lead);

        log.info("Lead score rafraîchi pour lead {} : {}/100 ({})", leadId, dto.getScore(), dto.getLabel());
        return dto;
    }

    // ─── Logique privée ───────────────────────────────────────────────────────

    private LeadScoreDto buildScore(Lead lead) {

        // ── 1. Profil (0-35) ─────────────────────────────────────────────────
        boolean hasEmail        = notBlank(lead.getEmail());
        boolean hasPhone        = notBlank(lead.getPhone()) || notBlank(lead.getMobile());
        boolean hasCompany      = notBlank(lead.getCompanyName());
        boolean hasJobTitle     = notBlank(lead.getJobTitle());
        boolean hasCity         = notBlank(lead.getCity());
        boolean hasWebOrLinkedin = notBlank(lead.getWebsite()) || notBlank(lead.getLinkedinUrl());

        int profile = (hasEmail        ? 7 : 0)
                    + (hasPhone        ? 7 : 0)
                    + (hasCompany      ? 7 : 0)
                    + (hasJobTitle     ? 5 : 0)
                    + (hasCity         ? 5 : 0)
                    + (hasWebOrLinkedin? 4 : 0);
        profile = Math.min(profile, 35);

        // ── 2. Qualification (0-40) ──────────────────────────────────────────
        boolean hasBudgetRange        = notBlank(lead.getBudgetRange());
        boolean hasDecisionTimeframe  = notBlank(lead.getDecisionTimeframe());
        boolean hasInterestedProducts = lead.getInterestedProducts() != null
                                     && !lead.getInterestedProducts().isEmpty();
        boolean hasIndustry           = notBlank(lead.getIndustry());
        boolean hasNumEmployees       = notBlank(lead.getNumEmployees());

        int qualification = (hasBudgetRange       ? 10 : 0)
                          + (hasDecisionTimeframe  ? 10 : 0)
                          + (hasInterestedProducts ? 10 : 0)
                          + (hasIndustry           ?  5 : 0)
                          + (hasNumEmployees       ?  5 : 0);
        qualification = Math.min(qualification, 40);

        // ── 3. Engagement (0-25) ─────────────────────────────────────────────
        String status = lead.getStatus() != null ? lead.getStatus() : "new";
        int statusPts;
        switch (status) {
            case "contacted"    -> statusPts = 8;
            case "nurturing"    -> statusPts = 13;
            case "qualified"    -> statusPts = 18;
            case "converted"    -> statusPts = 25;
            case "unqualified"  -> statusPts = 1;
            default             -> statusPts = 3;   // "new"
        }

        String rating = lead.getRating() != null ? lead.getRating() : "";
        int ratingBonus = switch (rating) {
            case "hot"  -> 5;
            case "warm" -> 2;
            default     -> 0;
        };

        int engagement = Math.min(statusPts + ratingBonus, 25);

        // ── Score total ──────────────────────────────────────────────────────
        int score = Math.max(0, Math.min(100, profile + qualification + engagement));

        // ── Label et couleur ─────────────────────────────────────────────────
        String label, color;
        if      (score >= 80) { label = "Très qualifié"; color = "#52c41a"; }
        else if (score >= 60) { label = "Qualifié";      color = "#73d13d"; }
        else if (score >= 40) { label = "En cours";      color = "#faad14"; }
        else if (score >= 20) { label = "Peu qualifié";  color = "#ff7a45"; }
        else                  { label = "Non qualifié";  color = "#ff4d4f"; }

        boolean hasMeeting = lead.getMeetingScheduledAt() != null;
        boolean hasDemo    = Boolean.TRUE.equals(lead.getProductDemoRequested());

        return LeadScoreDto.builder()
                .score(score)
                .label(label)
                .color(color)
                .breakdown(LeadScoreDto.Breakdown.builder()
                        .profile(profile)
                        .qualification(qualification)
                        .engagement(engagement)
                        .hasEmail(hasEmail)
                        .hasPhone(hasPhone)
                        .hasCompany(hasCompany)
                        .hasJobTitle(hasJobTitle)
                        .hasCity(hasCity)
                        .hasWebOrLinkedin(hasWebOrLinkedin)
                        .hasBudgetRange(hasBudgetRange)
                        .hasDecisionTimeframe(hasDecisionTimeframe)
                        .hasInterestedProducts(hasInterestedProducts)
                        .hasIndustry(hasIndustry)
                        .hasNumEmployees(hasNumEmployees)
                        .status(status)
                        .rating(rating)
                        .hasMeetingScheduled(hasMeeting)
                        .hasDemoRequested(hasDemo)
                        .build())
                .build();
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
