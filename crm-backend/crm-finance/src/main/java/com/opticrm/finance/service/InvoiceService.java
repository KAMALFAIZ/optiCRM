package com.opticrm.finance.service;

import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.common.exception.ValidationException;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.finance.dto.*;
import com.opticrm.finance.entity.Invoice;
import com.opticrm.finance.entity.InvoiceLine;
import com.opticrm.finance.repository.InvoiceRepository;
import com.opticrm.security.config.ContextUtils;
import com.opticrm.security.entity.User;
import com.opticrm.security.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final AccountRepository accountRepository;
    private final SecurityService securityService;

    @Transactional(readOnly = true)
    public Page<InvoiceListDto> findAll(
            UUID accountId,
            Invoice.InvoiceStatus status,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {

        // COMMERCIAL ne voit que ses propres factures
        if (ContextUtils.hasRole("COMMERCIAL")) {
            UUID uid = ContextUtils.getCurrentUserId().orElse(null);
            if (uid != null) {
                return invoiceRepository.findByCreatedById(uid, pageable).map(this::toListDto);
            }
        }

        return invoiceRepository.findWithFilters(accountId, status, startDate, endDate, pageable)
                .map(this::toListDto);
    }

    @Transactional(readOnly = true)
    public Page<InvoiceListDto> search(String search, Pageable pageable) {
        return invoiceRepository.search(search, pageable).map(this::toListDto);
    }

    @Transactional(readOnly = true)
    public InvoiceDto findById(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvée"));
        return toDto(invoice);
    }

    @Transactional(readOnly = true)
    public List<InvoiceListDto> findByAccountId(UUID accountId) {
        return invoiceRepository.findByAccountId(accountId).stream()
                .map(this::toListDto)
                .collect(Collectors.toList());
    }

    public InvoiceDto create(CreateInvoiceRequest request) {
        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Compte non trouvé"));

        User currentUser = securityService.getCurrentUser();

        if (request.getDueDate() != null && request.getInvoiceDate() != null
                && request.getDueDate().isBefore(request.getInvoiceDate())) {
            throw new ValidationException("La date d'échéance doit être postérieure à la date de facture");
        }

        String invoiceNumber = generateInvoiceNumber();

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .invoiceType(request.getInvoiceType() != null ? request.getInvoiceType() : Invoice.InvoiceType.INVOICE)
                .status(Invoice.InvoiceStatus.DRAFT)
                .account(account)
                .contactId(request.getContactId())
                .quoteId(request.getQuoteId())
                .orderId(request.getOrderId())
                .invoiceDate(request.getInvoiceDate())
                .dueDate(request.getDueDate())
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .currency(request.getCurrency() != null ? request.getCurrency() : "MAD")
                .billingName(request.getBillingName())
                .billingStreet(request.getBillingStreet())
                .billingCity(request.getBillingCity())
                .billingState(request.getBillingState())
                .billingPostalCode(request.getBillingPostalCode())
                .billingCountry(request.getBillingCountry())
                .paymentTermsId(request.getPaymentTermsId())
                .notes(request.getNotes())
                .createdBy(currentUser)
                .lines(new ArrayList<>())
                .build();

        // Add lines
        if (request.getLines() != null && !request.getLines().isEmpty()) {
            AtomicInteger order = new AtomicInteger(0);
            for (InvoiceLineRequest lineReq : request.getLines()) {
                InvoiceLine line = InvoiceLine.builder()
                        .productId(lineReq.getProductId())
                        .productCode(lineReq.getProductCode())
                        .description(lineReq.getDescription())
                        .quantity(lineReq.getQuantity())
                        .unitPrice(lineReq.getUnitPrice())
                        .discountAmount(lineReq.getDiscountAmount() != null ? lineReq.getDiscountAmount() : BigDecimal.ZERO)
                        .taxRate(lineReq.getTaxRate())
                        .sortOrder(lineReq.getSortOrder() != null ? lineReq.getSortOrder() : order.getAndIncrement())
                        .build();
                invoice.addLine(line);
            }
        }

        invoice.recalculate();
        invoice = invoiceRepository.save(invoice);
        return toDto(invoice);
    }

    public InvoiceDto update(UUID id, UpdateInvoiceRequest request) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvée"));

        if (invoice.getStatus() == Invoice.InvoiceStatus.PAID) {
            throw new ValidationException("Impossible de modifier une facture payée");
        }

        if (request.getStatus() != null) {
            invoice.setStatus(request.getStatus());
        }
        if (request.getContactId() != null) {
            invoice.setContactId(request.getContactId());
        }
        if (request.getInvoiceDate() != null) {
            invoice.setInvoiceDate(request.getInvoiceDate());
        }
        if (request.getDueDate() != null) {
            invoice.setDueDate(request.getDueDate());
        }
        if (request.getDiscountAmount() != null) {
            invoice.setDiscountAmount(request.getDiscountAmount());
        }
        if (request.getCurrency() != null) {
            invoice.setCurrency(request.getCurrency());
        }
        if (request.getBillingName() != null) {
            invoice.setBillingName(request.getBillingName());
        }
        if (request.getBillingStreet() != null) {
            invoice.setBillingStreet(request.getBillingStreet());
        }
        if (request.getBillingCity() != null) {
            invoice.setBillingCity(request.getBillingCity());
        }
        if (request.getBillingState() != null) {
            invoice.setBillingState(request.getBillingState());
        }
        if (request.getBillingPostalCode() != null) {
            invoice.setBillingPostalCode(request.getBillingPostalCode());
        }
        if (request.getBillingCountry() != null) {
            invoice.setBillingCountry(request.getBillingCountry());
        }
        if (request.getPaymentTermsId() != null) {
            invoice.setPaymentTermsId(request.getPaymentTermsId());
        }
        if (request.getNotes() != null) {
            invoice.setNotes(request.getNotes());
        }

        // Update lines if provided
        if (request.getLines() != null) {
            invoice.clearLines();
            AtomicInteger order = new AtomicInteger(0);
            for (InvoiceLineRequest lineReq : request.getLines()) {
                InvoiceLine line = InvoiceLine.builder()
                        .productId(lineReq.getProductId())
                        .productCode(lineReq.getProductCode())
                        .description(lineReq.getDescription())
                        .quantity(lineReq.getQuantity())
                        .unitPrice(lineReq.getUnitPrice())
                        .discountAmount(lineReq.getDiscountAmount() != null ? lineReq.getDiscountAmount() : BigDecimal.ZERO)
                        .taxRate(lineReq.getTaxRate())
                        .sortOrder(lineReq.getSortOrder() != null ? lineReq.getSortOrder() : order.getAndIncrement())
                        .build();
                invoice.addLine(line);
            }
            invoice.recalculate();
        }

        invoice = invoiceRepository.save(invoice);
        return toDto(invoice);
    }

    public void delete(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvée"));

        if (invoice.getStatus() == Invoice.InvoiceStatus.PAID) {
            throw new ValidationException("Impossible de supprimer une facture payée");
        }
        if (invoice.getStatus() == Invoice.InvoiceStatus.SENT) {
            throw new ValidationException("Impossible de supprimer une facture envoyée. Annulez-la d'abord.");
        }

        invoiceRepository.delete(invoice);
    }

    public InvoiceDto markAsSent(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvée"));

        if (invoice.getStatus() != Invoice.InvoiceStatus.DRAFT) {
            throw new ValidationException("Seule une facture en brouillon peut être envoyée");
        }

        invoice.setStatus(Invoice.InvoiceStatus.SENT);
        invoice.setSentAt(Instant.now());
        invoice = invoiceRepository.save(invoice);
        return toDto(invoice);
    }

    public InvoiceDto markAsPaid(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvée"));

        if (invoice.getStatus() == Invoice.InvoiceStatus.CANCELLED) {
            throw new ValidationException("Impossible de marquer une facture annulée comme payée");
        }

        invoice.setStatus(Invoice.InvoiceStatus.PAID);
        invoice.setAmountPaid(invoice.getTotal());
        invoice.setPaidAt(Instant.now());
        invoice = invoiceRepository.save(invoice);
        return toDto(invoice);
    }

    public InvoiceDto cancel(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvée"));

        if (invoice.getStatus() == Invoice.InvoiceStatus.PAID) {
            throw new ValidationException("Impossible d'annuler une facture payée");
        }

        invoice.setStatus(Invoice.InvoiceStatus.CANCELLED);
        invoice = invoiceRepository.save(invoice);
        return toDto(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceStatsDto getStats() {
        LocalDate today = LocalDate.now();

        long totalInvoices = invoiceRepository.count();
        BigDecimal totalInvoiced = invoiceRepository.sumTotal();
        BigDecimal totalPaid = invoiceRepository.sumPaid();
        BigDecimal totalDue = invoiceRepository.sumDue();
        long overdueCount = invoiceRepository.countOverdue(today);
        BigDecimal overdueAmount = invoiceRepository.sumOverdue(today);
        long draftCount = invoiceRepository.countByStatus(Invoice.InvoiceStatus.DRAFT);
        long sentCount = invoiceRepository.countByStatus(Invoice.InvoiceStatus.SENT);
        long paidCount = invoiceRepository.countByStatus(Invoice.InvoiceStatus.PAID);

        return InvoiceStatsDto.builder()
                .totalInvoices(totalInvoices)
                .totalInvoiced(totalInvoiced != null ? totalInvoiced : BigDecimal.ZERO)
                .totalPaid(totalPaid != null ? totalPaid : BigDecimal.ZERO)
                .totalDue(totalDue != null ? totalDue : BigDecimal.ZERO)
                .overdueCount(overdueCount)
                .overdueAmount(overdueAmount != null ? overdueAmount : BigDecimal.ZERO)
                .draftCount(draftCount)
                .sentCount(sentCount)
                .paidCount(paidCount)
                .build();
    }

    private String generateInvoiceNumber() {
        Integer maxNumber = invoiceRepository.findMaxInvoiceNumber();
        int nextNumber = (maxNumber != null ? maxNumber : 0) + 1;
        return String.format("FAC-%05d", nextNumber);
    }

    private InvoiceDto toDto(Invoice invoice) {
        List<InvoiceLineDto> lineDtos = invoice.getLines().stream()
                .map(this::toLineDto)
                .collect(Collectors.toList());

        return InvoiceDto.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .invoiceType(invoice.getInvoiceType())
                .status(invoice.getStatus())
                .account(InvoiceDto.AccountSummaryDto.builder()
                        .id(invoice.getAccount().getId())
                        .name(invoice.getAccount().getName())
                        .build())
                .contactId(invoice.getContactId())
                .quoteId(invoice.getQuoteId())
                .orderId(invoice.getOrderId())
                .invoiceDate(invoice.getInvoiceDate())
                .dueDate(invoice.getDueDate())
                .subtotal(invoice.getSubtotal())
                .discountAmount(invoice.getDiscountAmount())
                .taxAmount(invoice.getTaxAmount())
                .total(invoice.getTotal())
                .amountPaid(invoice.getAmountPaid())
                .amountDue(invoice.getAmountDue())
                .currency(invoice.getCurrency())
                .billingName(invoice.getBillingName())
                .billingStreet(invoice.getBillingStreet())
                .billingCity(invoice.getBillingCity())
                .billingState(invoice.getBillingState())
                .billingPostalCode(invoice.getBillingPostalCode())
                .billingCountry(invoice.getBillingCountry())
                .paymentTermsId(invoice.getPaymentTermsId())
                .notes(invoice.getNotes())
                .pdfUrl(invoice.getPdfUrl())
                .createdBy(invoice.getCreatedBy() != null ? InvoiceDto.UserSummaryDto.builder()
                        .id(invoice.getCreatedBy().getId())
                        .fullName(invoice.getCreatedBy().getFullName())
                        .build() : null)
                .lines(lineDtos)
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .sentAt(invoice.getSentAt())
                .paidAt(invoice.getPaidAt())
                .build();
    }

    private InvoiceListDto toListDto(Invoice invoice) {
        return InvoiceListDto.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .invoiceType(invoice.getInvoiceType())
                .status(invoice.getStatus())
                .accountName(invoice.getAccount().getName())
                .accountId(invoice.getAccount().getId())
                .invoiceDate(invoice.getInvoiceDate())
                .dueDate(invoice.getDueDate())
                .total(invoice.getTotal())
                .amountPaid(invoice.getAmountPaid())
                .amountDue(invoice.getAmountDue())
                .currency(invoice.getCurrency())
                .createdByName(invoice.getCreatedBy() != null ? invoice.getCreatedBy().getFullName() : null)
                .overdue(invoice.isOverdue())
                .build();
    }

    private InvoiceLineDto toLineDto(InvoiceLine line) {
        return InvoiceLineDto.builder()
                .id(line.getId())
                .productId(line.getProductId())
                .productCode(line.getProductCode())
                .description(line.getDescription())
                .quantity(line.getQuantity())
                .unitPrice(line.getUnitPrice())
                .discountAmount(line.getDiscountAmount())
                .taxRate(line.getTaxRate())
                .taxAmount(line.getTaxAmount())
                .total(line.getTotal())
                .sortOrder(line.getSortOrder())
                .build();
    }
}
