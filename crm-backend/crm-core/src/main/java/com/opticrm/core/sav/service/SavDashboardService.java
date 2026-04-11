package com.opticrm.core.sav.service;

import com.opticrm.core.sav.entity.SavEscalade;
import com.opticrm.core.sav.entity.SavTicket;
import com.opticrm.core.sav.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavDashboardService {

    private final SavTicketRepository ticketRepository;
    private final SavEscaladeRepository escaladeRepository;
    private final KbArticleRepository kbArticleRepository;

    public Map<String, Object> getDashboardStats() {
        Instant depuis7jours = Instant.now().minus(7, ChronoUnit.DAYS);
        Instant debutJour = Instant.now().minus(1, ChronoUnit.DAYS);

        // Compteurs par statut/criticité
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("tickets_ouverts_p1", ticketRepository.countByStatutAndCriticite("OUVERT", "P1"));
        stats.put("tickets_ouverts_p2", ticketRepository.countByStatutAndCriticite("OUVERT", "P2"));
        stats.put("tickets_ouverts_p3", ticketRepository.countByStatutAndCriticite("OUVERT", "P3"));

        long totalResolus = ticketRepository.countResolusDepuis(depuis7jours);
        long resoluParIa = ticketRepository.countResoluParIa(depuis7jours);
        stats.put("resolus_7_jours", totalResolus);
        stats.put("taux_resolution_ia", totalResolus > 0 ? (double) resoluParIa / totalResolus * 100 : 0);

        // Escalades en attente
        List<SavEscalade> escalades = escaladeRepository.findByStatutOrderByCreatedAtDesc("EN_ATTENTE");
        stats.put("escalades_en_attente", escalades.size());

        List<Map<String, Object>> escaladesList = escalades.stream().limit(10).map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", e.getId());
            m.put("numero_ticket", e.getTicket().getNumeroTicket());
            m.put("criticite", e.getTicket().getCriticite());
            m.put("domaine", e.getTicket().getDomaine());
            m.put("client", e.getTicket().getAccount() != null ? e.getTicket().getAccount().getName() : "?");
            m.put("created_at", e.getCreatedAt());
            m.put("raison", e.getRaisonEscalade());
            return m;
        }).collect(Collectors.toList());
        stats.put("escalades_liste", escaladesList);

        // Tickets par domaine
        List<Object[]> parDomaine = ticketRepository.countByDomaineDepuis(depuis7jours);
        Map<String, Long> domaineStats = new LinkedHashMap<>();
        for (Object[] row : parDomaine) {
            domaineStats.put((String) row[0], (Long) row[1]);
        }
        stats.put("tickets_par_domaine", domaineStats);

        // KB stats
        long articlesActifs = kbArticleRepository.findByActifTrue().size();
        long articlesValides = kbArticleRepository.findAll().stream()
                .filter(a -> Boolean.TRUE.equals(a.getValideParKamal())).count();
        stats.put("kb_articles_actifs", articlesActifs);
        stats.put("kb_articles_valides", articlesValides);

        return stats;
    }

    public List<Map<String, Object>> getRecentTickets(int limit) {
        return ticketRepository.findAll().stream()
                .sorted(Comparator.comparing(SavTicket::getCreatedAt).reversed())
                .limit(limit)
                .map(t -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", t.getId());
                    m.put("numero", t.getNumeroTicket());
                    m.put("client", t.getAccount() != null ? t.getAccount().getName() : "?");
                    m.put("domaine", t.getDomaine());
                    m.put("criticite", t.getCriticite());
                    m.put("statut", t.getStatut());
                    m.put("resolu_par", t.getResoluPar());
                    m.put("created_at", t.getCreatedAt());
                    return m;
                }).collect(Collectors.toList());
    }
}
