package com.opticrm.delivery.service;

import com.opticrm.delivery.dto.RepDashboardDTO;
import com.opticrm.delivery.dto.RepObjectiveDTO;
import com.opticrm.delivery.entity.DeliveryLine;
import com.opticrm.delivery.entity.DeliveryTour;
import com.opticrm.delivery.entity.VehicleLoad;
import com.opticrm.delivery.entity.VehicleLoadItem;
import com.opticrm.delivery.repository.DeliveryLineRepository;
import com.opticrm.delivery.repository.DeliveryTourRepository;
import com.opticrm.delivery.repository.VehicleLoadRepository;
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
public class RepDashboardService {

    private final DeliveryTourRepository tourRepository;
    private final DeliveryLineRepository lineRepository;
    private final VehicleLoadRepository loadRepository;
    private final RepObjectiveService objectiveService;

    public RepDashboardDTO getDashboard(UUID repId, LocalDate date) {
        final LocalDate targetDate = date != null ? date : LocalDate.now();

        // Trouver la tournée du jour pour ce représentant
        List<DeliveryTour> todayTours = tourRepository.findByTourDate(targetDate).stream()
            .filter(t -> repId.equals(t.getRepresentativeId()))
            .toList();

        if (todayTours.isEmpty()) {
            return RepDashboardDTO.builder()
                .representativeId(repId).date(targetDate)
                .tourStatus("NO_TOUR")
                .build();
        }

        DeliveryTour tour = todayTours.get(0);
        List<DeliveryLine> lines = tour.getDeliveryLines() != null ? tour.getDeliveryLines() : List.of();

        // ── Compteurs de visites ──────────────────────────────────────────────
        int totalClients    = lines.size();
        int delivered = 0, absent = 0, refused = 0, closed = 0, partial = 0;
        BigDecimal revenueToday = BigDecimal.ZERO;
        BigDecimal collectedToday = BigDecimal.ZERO;
        BigDecimal creditToday = BigDecimal.ZERO;

        Map<UUID, int[]> itemSales = new LinkedHashMap<>();

        for (DeliveryLine l : lines) {
            DeliveryLine.VisitResult vr = l.getVisitResult();
            switch (vr != null ? vr : DeliveryLine.VisitResult.DELIVERED) {
                case DELIVERED -> delivered++;
                case ABSENT    -> absent++;
                case REFUSED   -> refused++;
                case CLOSED    -> closed++;
                case PARTIAL   -> { partial++; delivered++; }
            }

            if (vr == DeliveryLine.VisitResult.DELIVERED || vr == DeliveryLine.VisitResult.PARTIAL) {
                BigDecimal amt  = nvl(l.getAmount());
                BigDecimal paid = nvl(l.getPaidAmount());
                revenueToday   = revenueToday.add(amt);
                collectedToday = collectedToday.add(paid);
                if (l.getPaymentMode() == DeliveryLine.PaymentMode.CREDIT) {
                    creditToday = creditToday.add(amt.subtract(paid));
                }
                if (l.getItemId() != null) {
                    int[] stats = itemSales.computeIfAbsent(l.getItemId(), k -> new int[]{0, 0});
                    stats[0] += l.getQuantity() != null ? l.getQuantity() : 0;
                    // stats[1] unused for now
                }
            }
        }

        int visitedClients = delivered + absent + refused + closed + partial;
        int pendingClients = Math.max(0, totalClients - visitedClients);

        int rateToday = revenueToday.compareTo(BigDecimal.ZERO) > 0
            ? collectedToday.multiply(BigDecimal.valueOf(100))
                .divide(revenueToday, 0, RoundingMode.HALF_UP).intValue()
            : 0;

        // ── Objectif mensuel ──────────────────────────────────────────────────
        List<RepObjectiveDTO> objectives = objectiveService.getByRep(repId).stream()
            .filter(o -> o.getYear() == targetDate.getYear() && o.getMonth() == targetDate.getMonthValue())
            .toList();

        BigDecimal revenueTarget   = BigDecimal.ZERO;
        BigDecimal revenueActual   = BigDecimal.ZERO;
        int revenueRateMonth = 0, visitTarget = 0, visitActual = 0, visitRateMonth = 0;

        if (!objectives.isEmpty()) {
            RepObjectiveDTO obj = objectives.get(0);
            revenueTarget    = nvl(obj.getRevenueTarget());
            revenueActual    = nvl(obj.getRevenueActual());
            revenueRateMonth = obj.getRevenueRate();
            visitTarget      = obj.getVisitTarget() != null ? obj.getVisitTarget() : 0;
            visitActual      = obj.getVisitActual() != null ? obj.getVisitActual() : 0;
            visitRateMonth   = obj.getVisitRate();
        }

        // ── Stock restant dans le véhicule ────────────────────────────────────
        List<VehicleLoad> loads = loadRepository.findByDeliveryTourId(tour.getId());
        Map<UUID, Integer> loadedByItem = new HashMap<>();
        for (VehicleLoad vl : loads) {
            if (vl.getStatus() == VehicleLoad.LoadStatus.LOADED) {
                for (VehicleLoadItem item : vl.getItems()) {
                    loadedByItem.merge(item.getItemId(), item.getQuantity(), Integer::sum);
                }
            }
        }
        Map<UUID, Integer> soldByItem = new HashMap<>();
        for (DeliveryLine l : lines) {
            if (l.getVisitResult() == DeliveryLine.VisitResult.DELIVERED
                    || l.getVisitResult() == DeliveryLine.VisitResult.PARTIAL) {
                soldByItem.merge(l.getItemId(), l.getQuantity() != null ? l.getQuantity() : 0, Integer::sum);
            }
        }

        List<RepDashboardDTO.StockItem> stockRemaining = new ArrayList<>();
        int totalRemaining = 0;
        for (Map.Entry<UUID, Integer> e : loadedByItem.entrySet()) {
            int loaded = e.getValue();
            int sold   = soldByItem.getOrDefault(e.getKey(), 0);
            int rem    = Math.max(0, loaded - sold);
            totalRemaining += rem;
            stockRemaining.add(RepDashboardDTO.StockItem.builder()
                .itemId(e.getKey()).quantityLoaded(loaded).quantitySold(sold).quantityRemaining(rem)
                .build());
        }

        // ── Top 5 articles vendus ──────────────────────────────────────────────
        List<RepDashboardDTO.ItemStat> topItems = itemSales.entrySet().stream()
            .sorted((a, b) -> Integer.compare(b.getValue()[0], a.getValue()[0]))
            .limit(5)
            .map(e -> {
                BigDecimal rev = lines.stream()
                    .filter(l -> e.getKey().equals(l.getItemId())
                        && (l.getVisitResult() == DeliveryLine.VisitResult.DELIVERED
                            || l.getVisitResult() == DeliveryLine.VisitResult.PARTIAL))
                    .map(l -> nvl(l.getAmount()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                return RepDashboardDTO.ItemStat.builder()
                    .itemId(e.getKey()).quantitySold(e.getValue()[0]).revenue(rev).build();
            }).collect(Collectors.toList());

        Map<String, Integer> visitBreakdown = new LinkedHashMap<>();
        visitBreakdown.put("DELIVERED", delivered);
        visitBreakdown.put("PARTIAL",   partial);
        visitBreakdown.put("ABSENT",    absent);
        visitBreakdown.put("REFUSED",   refused);
        visitBreakdown.put("CLOSED",    closed);

        return RepDashboardDTO.builder()
            .representativeId(repId)
            .date(targetDate)
            .tourId(tour.getId())
            .tourStatus(tour.getStatus() != null ? tour.getStatus().name() : null)
            .totalClients(totalClients)
            .visitedClients(visitedClients)
            .deliveredClients(delivered)
            .pendingClients(pendingClients)
            .revenueToday(revenueToday)
            .collectedToday(collectedToday)
            .creditToday(creditToday)
            .collectionRateToday(rateToday)
            .revenueTarget(revenueTarget)
            .revenueActualMonth(revenueActual)
            .revenueRateMonth(revenueRateMonth)
            .visitTarget(visitTarget)
            .visitActualMonth(visitActual)
            .visitRateMonth(visitRateMonth)
            .stockRemainingTotal(totalRemaining)
            .stockRemaining(stockRemaining)
            .visitBreakdown(visitBreakdown)
            .topItemsToday(topItems)
            .build();
    }

    private static BigDecimal nvl(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
