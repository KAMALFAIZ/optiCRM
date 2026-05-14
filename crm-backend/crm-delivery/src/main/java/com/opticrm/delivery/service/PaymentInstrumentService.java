package com.opticrm.delivery.service;

import com.opticrm.delivery.dto.PaymentInstrumentDTO;
import com.opticrm.delivery.entity.PaymentInstrument;
import com.opticrm.delivery.entity.DeliveryLine;
import com.opticrm.delivery.repository.DeliveryLineRepository;
import com.opticrm.delivery.repository.PaymentInstrumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class PaymentInstrumentService {

    private final PaymentInstrumentRepository instrumentRepository;
    private final DeliveryLineRepository deliveryLineRepository;
    private final AuditTrailService auditTrailService;

    // ── Enregistrement ────────────────────────────────────────────────────────

    public PaymentInstrument register(UUID deliveryLineId, String instrumentType,
                                      String instrumentNumber, String bankName,
                                      BigDecimal amount, LocalDate dueDate, String notes) {
        DeliveryLine line = deliveryLineRepository.findById(deliveryLineId)
            .orElseThrow(() -> new IllegalArgumentException("Ligne de livraison introuvable : " + deliveryLineId));

        PaymentInstrument.InstrumentType type =
            PaymentInstrument.InstrumentType.valueOf(instrumentType);

        // Un chèque ou traite ne s'enregistre que si la ligne est CHEQUE ou TRAITE
        DeliveryLine.PaymentMode expectedMode = type == PaymentInstrument.InstrumentType.CHEQUE
            ? DeliveryLine.PaymentMode.CHEQUE
            : DeliveryLine.PaymentMode.TRAITE;
        if (line.getPaymentMode() != expectedMode) {
            throw new IllegalStateException(
                "La ligne de livraison a un mode de paiement incompatible avec " + type);
        }

        PaymentInstrument instrument = PaymentInstrument.builder()
            .deliveryLineId(deliveryLineId)
            .instrumentType(type)
            .instrumentNumber(instrumentNumber)
            .bankName(bankName)
            .amount(amount)
            .dueDate(dueDate)
            .status(PaymentInstrument.InstrumentStatus.PENDING)
            .notes(notes)
            .build();

        PaymentInstrument saved = instrumentRepository.save(instrument);
        auditTrailService.logAction("REGISTER_INSTRUMENT", "PaymentInstrument", saved.getId(), null,
            type + " n°" + instrumentNumber + " montant=" + amount);
        return saved;
    }

    // ── Encaissement ─────────────────────────────────────────────────────────

    public PaymentInstrument markEncaisse(UUID instrumentId, LocalDate encashDate) {
        PaymentInstrument pi = getOrThrow(instrumentId);
        if (pi.getStatus() != PaymentInstrument.InstrumentStatus.PENDING) {
            throw new IllegalStateException("Instrument déjà traité : " + pi.getStatus());
        }
        pi.setStatus(PaymentInstrument.InstrumentStatus.ENCAISSE);
        pi.setEncashDate(encashDate != null ? encashDate : LocalDate.now());
        PaymentInstrument saved = instrumentRepository.save(pi);
        auditTrailService.logAction("ENCAISSE_INSTRUMENT", "PaymentInstrument", instrumentId, null,
            "Encaissé le " + saved.getEncashDate());
        return saved;
    }

    // ── Rejet ─────────────────────────────────────────────────────────────────

    public PaymentInstrument markRejete(UUID instrumentId, String rejectionReason) {
        PaymentInstrument pi = getOrThrow(instrumentId);
        if (pi.getStatus() != PaymentInstrument.InstrumentStatus.PENDING) {
            throw new IllegalStateException("Instrument déjà traité : " + pi.getStatus());
        }
        pi.setStatus(PaymentInstrument.InstrumentStatus.REJETE);
        pi.setRejectionReason(rejectionReason);
        PaymentInstrument saved = instrumentRepository.save(pi);
        auditTrailService.logAction("REJETE_INSTRUMENT", "PaymentInstrument", instrumentId, null,
            "Rejeté : " + rejectionReason);
        return saved;
    }

    // ── Lectures ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PaymentInstrument> getByLine(UUID deliveryLineId) {
        return instrumentRepository.findByDeliveryLineId(deliveryLineId);
    }

    @Transactional(readOnly = true)
    public List<PaymentInstrument> getByTour(UUID tourId) {
        return instrumentRepository.findByTourId(tourId);
    }

    @Transactional(readOnly = true)
    public List<PaymentInstrument> getPendingOverdue() {
        return instrumentRepository.findOverduePending(LocalDate.now());
    }

    @Transactional(readOnly = true)
    public PaymentInstrumentDTO toDTO(PaymentInstrument pi) {
        return PaymentInstrumentDTO.builder()
            .id(pi.getId())
            .deliveryLineId(pi.getDeliveryLineId())
            .instrumentType(pi.getInstrumentType() != null ? pi.getInstrumentType().name() : null)
            .instrumentNumber(pi.getInstrumentNumber())
            .bankName(pi.getBankName())
            .amount(pi.getAmount())
            .dueDate(pi.getDueDate())
            .encashDate(pi.getEncashDate())
            .status(pi.getStatus() != null ? pi.getStatus().name() : null)
            .rejectionReason(pi.getRejectionReason())
            .notes(pi.getNotes())
            .build();
    }

    private PaymentInstrument getOrThrow(UUID id) {
        return instrumentRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Instrument introuvable : " + id));
    }
}
