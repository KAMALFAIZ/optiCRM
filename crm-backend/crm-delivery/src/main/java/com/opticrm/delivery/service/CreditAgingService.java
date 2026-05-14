package com.opticrm.delivery.service;

import com.opticrm.delivery.dto.CreditAgingDTO;
import com.opticrm.delivery.entity.DeliveryLine;
import com.opticrm.delivery.repository.DeliveryLineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class CreditAgingService {

    private final DeliveryLineRepository deliveryLineRepository;

    /**
     * Retourne le tableau de créances en souffrance (aging receivables).
     * Filtre optionnel par customerId.
     */
    public CreditAgingDTO getAging(UUID customerId) {
        List<DeliveryLine> pendingLines = deliveryLineRepository.findAllPendingCreditLines();

        // Filtre client si demandé
        if (customerId != null) {
            pendingLines = pendingLines.stream()
                .filter(l -> customerId.equals(l.getCustomerId()))
                .collect(Collectors.toList());
        }

        LocalDate today = LocalDate.now();
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal b0_30 = BigDecimal.ZERO, b31_60 = BigDecimal.ZERO,
                   b61_90 = BigDecimal.ZERO, bOver90 = BigDecimal.ZERO;

        List<CreditAgingDTO.CreditLine> creditLines = new java.util.ArrayList<>();

        for (DeliveryLine l : pendingLines) {
            LocalDate tourDate = l.getDeliveryTour().getTourDate();
            long days = ChronoUnit.DAYS.between(tourDate, today);
            BigDecimal outstanding = l.getAmount()
                .subtract(l.getPaidAmount() != null ? l.getPaidAmount() : BigDecimal.ZERO);
            if (outstanding.compareTo(BigDecimal.ZERO) <= 0) continue;

            String bucket;
            if      (days <= 30) { bucket = "0-30";  b0_30  = b0_30.add(outstanding); }
            else if (days <= 60) { bucket = "31-60"; b31_60 = b31_60.add(outstanding); }
            else if (days <= 90) { bucket = "61-90"; b61_90 = b61_90.add(outstanding); }
            else                 { bucket = "+90";   bOver90 = bOver90.add(outstanding); }

            total = total.add(outstanding);

            creditLines.add(CreditAgingDTO.CreditLine.builder()
                .lineId(l.getId())
                .customerId(l.getCustomerId())
                .tourId(l.getDeliveryTour().getId())
                .tourDate(tourDate)
                .agingDays((int) days)
                .agingBucket(bucket)
                .invoicedAmount(l.getAmount())
                .paidAmount(l.getPaidAmount() != null ? l.getPaidAmount() : BigDecimal.ZERO)
                .outstanding(outstanding)
                .tourStatus(l.getDeliveryTour().getStatus() != null ? l.getDeliveryTour().getStatus().name() : null)
                .build());
        }

        return CreditAgingDTO.builder()
            .totalOutstanding(total)
            .bucket0_30(b0_30)
            .bucket31_60(b31_60)
            .bucket61_90(b61_90)
            .bucketOver90(bOver90)
            .lines(creditLines)
            .build();
    }
}
