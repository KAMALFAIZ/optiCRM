package com.opticrm.delivery.service;

import com.opticrm.delivery.dto.TourReportDTO;
import com.opticrm.delivery.entity.DeliveryLine;
import com.opticrm.delivery.entity.DeliveryTour;
import com.opticrm.delivery.repository.DeliveryTourRepository;
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
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class DeliveryReportService {

    private final DeliveryTourRepository deliveryTourRepository;

    /**
     * Rapport détaillé tournée par tournée pour une période donnée.
     * Filtre optionnel par représentant.
     */
    public List<TourReportDTO> getTourReports(LocalDate from, LocalDate to, UUID representativeId) {
        List<DeliveryTour> tours = deliveryTourRepository.findByTourDateBetween(from, to);

        return tours.stream()
            .filter(t -> representativeId == null || representativeId.equals(t.getRepresentativeId()))
            .map(this::buildTourReport)
            .collect(Collectors.toList());
    }

    private TourReportDTO buildTourReport(DeliveryTour tour) {
        List<DeliveryLine> lines = tour.getDeliveryLines() != null ? tour.getDeliveryLines() : List.of();

        int lineCount = lines.size();
        int delivered = 0, absent = 0, refused = 0;
        BigDecimal total = BigDecimal.ZERO, cash = BigDecimal.ZERO,
                   credit = BigDecimal.ZERO, collected = BigDecimal.ZERO;

        for (DeliveryLine l : lines) {
            DeliveryLine.VisitResult vr = l.getVisitResult();
            if (vr == DeliveryLine.VisitResult.DELIVERED || vr == DeliveryLine.VisitResult.PARTIAL) {
                delivered++;
                BigDecimal amt  = l.getAmount()    != null ? l.getAmount()    : BigDecimal.ZERO;
                BigDecimal paid = l.getPaidAmount() != null ? l.getPaidAmount() : BigDecimal.ZERO;
                total     = total.add(amt);
                collected = collected.add(paid);
                if (l.getPaymentMode() == DeliveryLine.PaymentMode.CASH)   cash   = cash.add(paid);
                if (l.getPaymentMode() == DeliveryLine.PaymentMode.CREDIT) credit = credit.add(amt);
            } else if (vr == DeliveryLine.VisitResult.ABSENT)  { absent++; }
            else if (vr == DeliveryLine.VisitResult.REFUSED)   { refused++; }
        }

        BigDecimal outstanding = credit.subtract(
            collected.subtract(cash) // paiements partiels crédit
        );
        if (outstanding.compareTo(BigDecimal.ZERO) < 0) outstanding = BigDecimal.ZERO;

        int rate = total.compareTo(BigDecimal.ZERO) > 0
            ? collected.multiply(BigDecimal.valueOf(100)).divide(total, 0, RoundingMode.HALF_UP).intValue()
            : 0;

        return TourReportDTO.builder()
            .tourId(tour.getId())
            .tourDate(tour.getTourDate())
            .zone(tour.getZone())
            .representativeId(tour.getRepresentativeId())
            .tourStatus(tour.getStatus() != null ? tour.getStatus().name() : null)
            .lineCount(lineCount)
            .deliveredCount(delivered)
            .absentCount(absent)
            .refusedCount(refused)
            .totalAmount(total)
            .cashAmount(cash)
            .creditAmount(credit)
            .collectedAmount(collected)
            .outstandingCredit(outstanding)
            .collectionRate(rate)
            .build();
    }
}
