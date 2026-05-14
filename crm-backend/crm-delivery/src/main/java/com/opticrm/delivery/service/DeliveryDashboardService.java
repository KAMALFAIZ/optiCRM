package com.opticrm.delivery.service;

import com.opticrm.delivery.dto.DashboardKpiDTO;
import com.opticrm.delivery.entity.DeliveryLine;
import com.opticrm.delivery.entity.DeliveryTour;
import com.opticrm.delivery.repository.DeliveryLineRepository;
import com.opticrm.delivery.repository.DeliveryTourRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class DeliveryDashboardService {

    private final DeliveryLineRepository deliveryLineRepository;
    private final DeliveryTourRepository deliveryTourRepository;

    public DashboardKpiDTO getKpis() {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate thirtyDaysAgo = today.minusDays(29);

        // Mois précédent
        LocalDate prevMonthEnd   = monthStart.minusDays(1);
        LocalDate prevMonthStart = prevMonthEnd.withDayOfMonth(1);

        // ── Tournées ──────────────────────────────────────────────────────────
        long draft  = deliveryTourRepository.countByStatus(DeliveryTour.TourStatus.DRAFT);
        long active = deliveryTourRepository.countByStatus(DeliveryTour.TourStatus.VALIDE);
        long closed = deliveryTourRepository.countByStatus(DeliveryTour.TourStatus.CLOSED);
        long toursToday = deliveryTourRepository.findByTourDate(today).size();

        // ── CA ────────────────────────────────────────────────────────────────
        BigDecimal revToday     = deliveryLineRepository.sumRevenueByPeriod(today, today);
        BigDecimal revMonth     = deliveryLineRepository.sumRevenueByPeriod(monthStart, today);
        BigDecimal colToday     = deliveryLineRepository.sumCollectedByPeriod(today, today);
        BigDecimal colMonth     = deliveryLineRepository.sumCollectedByPeriod(monthStart, today);

        // ── CA mois précédent ─────────────────────────────────────────────────
        BigDecimal revMonthPrev = deliveryLineRepository.sumRevenueByPeriod(prevMonthStart, prevMonthEnd);
        BigDecimal colMonthPrev = deliveryLineRepository.sumCollectedByPeriod(prevMonthStart, prevMonthEnd);

        int rateToday     = rate(revToday, colToday);
        int rateMonth     = rate(revMonth, colMonth);
        int rateMonthPrev = rate(revMonthPrev, colMonthPrev);

        Integer revenueGrowthPct = growthPct(revMonth, revMonthPrev);

        // ── Crédit en cours ───────────────────────────────────────────────────
        BigDecimal totalCredit = deliveryLineRepository.findAllPendingCreditLines().stream()
            .map(l -> l.getAmount().subtract(l.getPaidAmount() != null ? l.getPaidAmount() : BigDecimal.ZERO))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // ── Évolution 30j ─────────────────────────────────────────────────────
        List<Object[]> dailyRev = deliveryLineRepository.sumRevenueByDay(thirtyDaysAgo, today);
        List<Object[]> dailyCol  = new ArrayList<>(); // same query structure
        Map<LocalDate, BigDecimal> dailyColMap = new HashMap<>();
        // Build daily revenue list
        List<DashboardKpiDTO.DayRevenue> dailyList = dailyRev.stream().map(row -> {
            LocalDate d = (LocalDate) row[0];
            BigDecimal rev = toBD(row[1]);
            return DashboardKpiDTO.DayRevenue.builder()
                .date(d.toString())
                .revenue(rev)
                .collected(BigDecimal.ZERO) // collected separate query would add overhead
                .build();
        }).collect(Collectors.toList());

        // ── Top 5 reps ────────────────────────────────────────────────────────
        List<Object[]> repRows = deliveryLineRepository.sumRevenueByRepresentative(monthStart, today);
        List<DashboardKpiDTO.RepRevenue> topReps = repRows.stream().limit(5).map(row -> {
            UUID repId = (UUID) row[0];
            BigDecimal rev = toBD(row[1]);
            return DashboardKpiDTO.RepRevenue.builder()
                .representativeId(repId != null ? repId.toString() : "—")
                .revenue(rev)
                .collected(BigDecimal.ZERO)
                .tourCount(0)
                .build();
        }).collect(Collectors.toList());

        // ── Top 5 articles ────────────────────────────────────────────────────
        List<Object[]> itemRows = deliveryLineRepository.sumRevenueByItem(monthStart, today);
        List<DashboardKpiDTO.ItemRevenue> topItems = itemRows.stream().limit(5).map(row -> {
            UUID itemId = (UUID) row[0];
            int qty = ((Number) row[1]).intValue();
            BigDecimal rev = toBD(row[2]);
            return DashboardKpiDTO.ItemRevenue.builder()
                .itemId(itemId != null ? itemId.toString() : "—")
                .quantity(qty)
                .revenue(rev)
                .build();
        }).collect(Collectors.toList());

        // ── Répartition visites mois ──────────────────────────────────────────
        List<Object[]> visitRows = deliveryLineRepository.countVisitResultsByPeriod(monthStart, today);
        Map<String, Long> visitBreakdown = new LinkedHashMap<>();
        for (DeliveryLine.VisitResult vr : DeliveryLine.VisitResult.values()) {
            visitBreakdown.put(vr.name(), 0L);
        }
        for (Object[] row : visitRows) {
            DeliveryLine.VisitResult vr = (DeliveryLine.VisitResult) row[0];
            Long count = (Long) row[1];
            if (vr != null) visitBreakdown.put(vr.name(), count);
        }

        return DashboardKpiDTO.builder()
            .toursDraft(draft).toursValide(active).toursClosed(closed).toursToday(toursToday)
            .revenueToday(revToday).revenueMonth(revMonth)
            .collectedToday(colToday).collectedMonth(colMonth)
            .totalOutstandingCredit(totalCredit)
            .collectionRateToday(rateToday).collectionRateMonth(rateMonth)
            .revenueMonthPrev(revMonthPrev)
            .collectedMonthPrev(colMonthPrev)
            .collectionRateMonthPrev(rateMonthPrev)
            .revenueGrowthPct(revenueGrowthPct)
            .dailyRevenue(dailyList)
            .topReps(topReps)
            .topItems(topItems)
            .visitResultBreakdown(visitBreakdown)
            .build();
    }

    private static Integer growthPct(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) return null;
        if (current == null) return -100;
        return current.subtract(previous)
            .multiply(BigDecimal.valueOf(100))
            .divide(previous, 0, java.math.RoundingMode.HALF_UP)
            .intValue();
    }

    private static int rate(BigDecimal total, BigDecimal collected) {
        if (total == null || total.compareTo(BigDecimal.ZERO) == 0) return 0;
        if (collected == null) return 0;
        return collected.multiply(BigDecimal.valueOf(100))
            .divide(total, 0, RoundingMode.HALF_UP).intValue();
    }

    private static BigDecimal toBD(Object o) {
        if (o == null) return BigDecimal.ZERO;
        if (o instanceof BigDecimal bd) return bd;
        return new BigDecimal(o.toString());
    }
}
