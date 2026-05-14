package com.opticrm.delivery.service;

import com.opticrm.delivery.dto.RepObjectiveDTO;
import com.opticrm.delivery.entity.DeliveryLine;
import com.opticrm.delivery.entity.DeliveryTour;
import com.opticrm.delivery.entity.RepObjective;
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
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class RepObjectiveService {

    private final RepObjectiveRepository objectiveRepository;
    private final DeliveryTourRepository tourRepository;
    private final DeliveryLineRepository lineRepository;

    // ── CRUD ─────────────────────────────────────────────────────────────────

    public RepObjective upsert(RepObjectiveDTO dto) {
        RepObjective obj = objectiveRepository
            .findByRepresentativeIdAndYearAndMonth(dto.getRepresentativeId(), dto.getYear(), dto.getMonth())
            .orElse(RepObjective.builder()
                .representativeId(dto.getRepresentativeId())
                .year(dto.getYear())
                .month(dto.getMonth())
                .build());

        obj.setRevenueTarget(dto.getRevenueTarget() != null ? dto.getRevenueTarget() : BigDecimal.ZERO);
        obj.setVisitTarget(dto.getVisitTarget() != null ? dto.getVisitTarget() : 0);
        obj.setDeliveryTarget(dto.getDeliveryTarget() != null ? dto.getDeliveryTarget() : 0);
        obj.setNotes(dto.getNotes());
        return objectiveRepository.save(obj);
    }

    public void delete(UUID id) {
        objectiveRepository.deleteById(id);
    }

    // ── Lecture avec réalisé ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RepObjectiveDTO> getByYearMonth(int year, int month) {
        List<RepObjective> objectives = objectiveRepository.findByYearAndMonth(year, month);
        return objectives.stream()
            .map(o -> buildWithActuals(o, year, month))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RepObjectiveDTO> getByRep(UUID repId) {
        return objectiveRepository.findByRepresentativeId(repId).stream()
            .map(o -> buildWithActuals(o, o.getYear(), o.getMonth()))
            .collect(Collectors.toList());
    }

    // ── Calcul réalisé ────────────────────────────────────────────────────────

    private RepObjectiveDTO buildWithActuals(RepObjective obj, int year, int month) {
        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to   = from.withDayOfMonth(from.lengthOfMonth());

        // Tournées du rep sur la période
        List<DeliveryTour> tours = tourRepository
            .findByTourDateBetween(from, to).stream()
            .filter(t -> obj.getRepresentativeId().equals(t.getRepresentativeId()))
            .collect(Collectors.toList());

        // CA et visites réalisés
        BigDecimal revenueActual = BigDecimal.ZERO;
        int visitActual   = 0;
        int deliveryActual = 0;

        for (DeliveryTour t : tours) {
            List<DeliveryLine> lines = t.getDeliveryLines() != null ? t.getDeliveryLines() : List.of();
            visitActual += lines.size();
            for (DeliveryLine l : lines) {
                if (l.getVisitResult() == DeliveryLine.VisitResult.DELIVERED
                        || l.getVisitResult() == DeliveryLine.VisitResult.PARTIAL) {
                    revenueActual = revenueActual.add(l.getAmount() != null ? l.getAmount() : BigDecimal.ZERO);
                    deliveryActual++;
                }
            }
        }

        int revenueRate  = pct(revenueActual,        obj.getRevenueTarget());
        int visitRate    = pct(BigDecimal.valueOf(visitActual),    BigDecimal.valueOf(obj.getVisitTarget()));
        int deliveryRate = pct(BigDecimal.valueOf(deliveryActual), BigDecimal.valueOf(obj.getDeliveryTarget()));

        return RepObjectiveDTO.builder()
            .id(obj.getId())
            .representativeId(obj.getRepresentativeId())
            .year(obj.getYear())
            .month(obj.getMonth())
            .revenueTarget(obj.getRevenueTarget())
            .visitTarget(obj.getVisitTarget())
            .deliveryTarget(obj.getDeliveryTarget())
            .notes(obj.getNotes())
            .revenueActual(revenueActual)
            .visitActual(visitActual)
            .deliveryActual(deliveryActual)
            .revenueRate(revenueRate)
            .visitRate(visitRate)
            .deliveryRate(deliveryRate)
            .build();
    }

    private static int pct(BigDecimal actual, BigDecimal target) {
        if (target == null || target.compareTo(BigDecimal.ZERO) == 0) return 0;
        return actual.multiply(BigDecimal.valueOf(100))
            .divide(target, 0, RoundingMode.HALF_UP)
            .min(BigDecimal.valueOf(999)).intValue();
    }
}
