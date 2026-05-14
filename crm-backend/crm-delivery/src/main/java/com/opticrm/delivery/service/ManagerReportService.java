package com.opticrm.delivery.service;

import com.opticrm.delivery.dto.AbcClientReportDTO;
import com.opticrm.delivery.dto.ComparativeReportDTO;
import com.opticrm.delivery.dto.RepSummaryReportDTO;
import com.opticrm.delivery.entity.DeliveryLine;
import com.opticrm.delivery.entity.DeliveryTour;
import com.opticrm.delivery.repository.DeliveryLineRepository;
import com.opticrm.delivery.repository.DeliveryTourRepository;
import com.opticrm.delivery.repository.RepObjectiveRepository;
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
public class ManagerReportService {

    private final DeliveryTourRepository tourRepository;
    private final DeliveryLineRepository lineRepository;
    private final RepObjectiveRepository objectiveRepository;

    // ── Résumé par représentant ───────────────────────────────────────────────

    public List<RepSummaryReportDTO> getRepSummaryReport(LocalDate from, LocalDate to) {
        List<DeliveryTour> tours = tourRepository.findByTourDateBetween(from, to);

        Map<UUID, RepSummaryReportDTO> byRep = new LinkedHashMap<>();

        for (DeliveryTour tour : tours) {
            UUID repId = tour.getRepresentativeId();
            RepSummaryReportDTO dto = byRep.computeIfAbsent(repId, id ->
                RepSummaryReportDTO.builder()
                    .representativeId(id)
                    .build());
            dto.setTourCount(dto.getTourCount() + 1);

            List<DeliveryLine> lines = tour.getDeliveryLines() != null ? tour.getDeliveryLines() : List.of();
            for (DeliveryLine l : lines) {
                dto.setTotalLines(dto.getTotalLines() + 1);
                DeliveryLine.VisitResult vr = l.getVisitResult();
                if (vr == DeliveryLine.VisitResult.DELIVERED || vr == DeliveryLine.VisitResult.PARTIAL) {
                    dto.setDeliveredCount(dto.getDeliveredCount() + 1);
                    BigDecimal amt  = nvl(l.getAmount());
                    BigDecimal paid = nvl(l.getPaidAmount());
                    dto.setTotalRevenue(nvl(dto.getTotalRevenue()).add(amt));
                    dto.setCollectedAmount(nvl(dto.getCollectedAmount()).add(paid));
                    if (l.getPaymentMode() == DeliveryLine.PaymentMode.CREDIT) {
                        dto.setCreditOutstanding(nvl(dto.getCreditOutstanding()).add(amt.subtract(paid)));
                    }
                } else if (vr == DeliveryLine.VisitResult.ABSENT) {
                    dto.setAbsentCount(dto.getAbsentCount() + 1);
                } else if (vr == DeliveryLine.VisitResult.REFUSED) {
                    dto.setRefusedCount(dto.getRefusedCount() + 1);
                } else if (vr == DeliveryLine.VisitResult.CLOSED) {
                    dto.setClosedCount(dto.getClosedCount() + 1);
                }
            }
        }

        // Calculer les taux + rattacher les objectifs du mois
        int year = from.getYear(), month = from.getMonthValue();
        for (RepSummaryReportDTO dto : byRep.values()) {
            BigDecimal rev  = nvl(dto.getTotalRevenue());
            BigDecimal col  = nvl(dto.getCollectedAmount());
            dto.setCollectionRate(pct(col, rev));
            dto.setDeliveryRate(dto.getTotalLines() > 0
                ? pct(BigDecimal.valueOf(dto.getDeliveredCount()), BigDecimal.valueOf(dto.getTotalLines()))
                : 0);

            objectiveRepository
                .findByRepresentativeIdAndYearAndMonth(dto.getRepresentativeId(), year, month)
                .ifPresent(obj -> {
                    dto.setRevenueTarget(obj.getRevenueTarget());
                    dto.setRevenueRateVsTarget(pct(rev, obj.getRevenueTarget()));
                });
        }

        return new ArrayList<>(byRep.values());
    }

    // ── Analyse ABC clients ───────────────────────────────────────────────────

    public AbcClientReportDTO getAbcClientReport(LocalDate from, LocalDate to, UUID repId) {
        List<Object[]> rows = lineRepository.sumRevenueByCustomer(from, to, repId);

        BigDecimal totalRevenue = rows.stream()
            .map(r -> (BigDecimal) r[1])
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<AbcClientReportDTO.ClientRow> clientRows = new ArrayList<>();
        BigDecimal cumulative = BigDecimal.ZERO;
        int rank = 0, countA = 0, countB = 0, countC = 0;

        for (Object[] row : rows) {
            rank++;
            UUID customerId  = (UUID)       row[0];
            BigDecimal rev   = (BigDecimal) row[1];
            BigDecimal paid  = (BigDecimal) row[2];
            int deliveries   = ((Number)    row[3]).intValue();

            BigDecimal revPct = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                ? rev.multiply(BigDecimal.valueOf(100)).divide(totalRevenue, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

            cumulative = cumulative.add(revPct);

            String segment;
            if (cumulative.compareTo(BigDecimal.valueOf(80)) <= 0 || rank == 1) {
                segment = "A"; countA++;
            } else if (cumulative.compareTo(BigDecimal.valueOf(95)) <= 0) {
                segment = "B"; countB++;
            } else {
                segment = "C"; countC++;
            }

            BigDecimal outstanding = lineRepository.sumOutstandingCreditByCustomer(customerId);

            clientRows.add(AbcClientReportDTO.ClientRow.builder()
                .customerId(customerId)
                .rank(rank)
                .revenue(rev)
                .revenuePercent(revPct)
                .cumulativePercent(cumulative)
                .segment(segment)
                .deliveryCount(deliveries)
                .outstandingCredit(outstanding != null ? outstanding : BigDecimal.ZERO)
                .build());
        }

        return AbcClientReportDTO.builder()
            .totalRevenue(totalRevenue)
            .totalClients(rows.size())
            .countA(countA).countB(countB).countC(countC)
            .clients(clientRows)
            .build();
    }

    // ── Comparatif N vs N-1 ───────────────────────────────────────────────────

    public ComparativeReportDTO getComparativeReport(LocalDate from, LocalDate to) {
        LocalDate fromN1 = from.minusYears(1);
        LocalDate toN1   = to.minusYears(1);

        List<Object[]> rowsN  = lineRepository.sumRevenueAndCollectedByRep(from, to);
        List<Object[]> rowsN1 = lineRepository.sumRevenueAndCollectedByRep(fromN1, toN1);

        Map<UUID, Object[]> mapN1 = new HashMap<>();
        for (Object[] r : rowsN1) mapN1.put((UUID) r[0], r);

        BigDecimal totalRevN = BigDecimal.ZERO, totalRevN1 = BigDecimal.ZERO;
        BigDecimal totalColN = BigDecimal.ZERO, totalColN1 = BigDecimal.ZERO;
        int delivN = 0, delivN1 = 0;

        List<ComparativeReportDTO.RepRow> repRows = new ArrayList<>();

        for (Object[] r : rowsN) {
            UUID repId       = (UUID)       r[0];
            BigDecimal revN  = (BigDecimal) r[1];
            BigDecimal colN  = (BigDecimal) r[2];
            int dN           = ((Number)    r[3]).intValue();

            Object[] rN1 = mapN1.getOrDefault(repId, new Object[]{repId, BigDecimal.ZERO, BigDecimal.ZERO, 0});
            BigDecimal revN1 = (BigDecimal) rN1[1];
            BigDecimal colN1 = (BigDecimal) rN1[2];

            totalRevN  = totalRevN.add(revN);
            totalRevN1 = totalRevN1.add(revN1);
            totalColN  = totalColN.add(colN);
            delivN     += dN;

            int varPct  = pct(revN.subtract(revN1), revN1 != null && revN1.compareTo(BigDecimal.ZERO) > 0 ? revN1 : null);
            int rateN   = pct(colN, revN);
            int rateN1  = pct(colN1, revN1);

            repRows.add(ComparativeReportDTO.RepRow.builder()
                .representativeId(repId)
                .revenueN(revN).revenueN1(revN1)
                .variationPct(varPct)
                .collectedN(colN).collectionRateN(rateN).collectionRateN1(rateN1)
                .build());
        }

        // Pour les reps qui étaient actifs N-1 mais pas N
        for (Object[] r : rowsN1) {
            UUID repId = (UUID) r[0];
            if (mapN1.containsKey(repId) && repRows.stream().noneMatch(x -> repId.equals(x.getRepresentativeId()))) {
                totalRevN1 = totalRevN1.add((BigDecimal) r[1]);
                totalColN1 = totalColN1.add((BigDecimal) r[2]);
                delivN1    += ((Number) r[3]).intValue();
            }
        }

        BigDecimal variation = totalRevN.subtract(totalRevN1);
        int varPct  = totalRevN1.compareTo(BigDecimal.ZERO) > 0
            ? variation.multiply(BigDecimal.valueOf(100)).divide(totalRevN1, 0, RoundingMode.HALF_UP).intValue() : 0;
        int colVarPct = totalColN1.compareTo(BigDecimal.ZERO) > 0
            ? totalColN.subtract(totalColN1).multiply(BigDecimal.valueOf(100))
                .divide(totalColN1, 0, RoundingMode.HALF_UP).intValue() : 0;
        int delivVarPct = delivN1 > 0 ? (delivN - delivN1) * 100 / delivN1 : 0;

        return ComparativeReportDTO.builder()
            .fromN(from).toN(to).fromN1(fromN1).toN1(toN1)
            .revenueN(totalRevN).revenueN1(totalRevN1)
            .revenueVariation(variation).revenueVariationPct(varPct)
            .collectedN(totalColN).collectedN1(totalColN1).collectedVariationPct(colVarPct)
            .deliveredCountN(delivN).deliveredCountN1(delivN1).deliveredVariationPct(delivVarPct)
            .repRows(repRows)
            .build();
    }

    // ── Utilitaires ───────────────────────────────────────────────────────────

    private static int pct(BigDecimal numerator, BigDecimal denominator) {
        if (denominator == null || denominator.compareTo(BigDecimal.ZERO) == 0) return 0;
        return numerator.multiply(BigDecimal.valueOf(100))
            .divide(denominator, 0, RoundingMode.HALF_UP).intValue();
    }

    private static BigDecimal nvl(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
