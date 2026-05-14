package com.opticrm.finance.service;

import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.common.exception.ValidationException;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.finance.dto.*;
import com.opticrm.finance.entity.Payment;
import com.opticrm.finance.entity.PaymentAllocation;
import com.opticrm.finance.repository.PaymentAllocationRepository;
import com.opticrm.finance.repository.PaymentRepository;
import com.opticrm.security.config.ContextUtils;
import com.opticrm.security.entity.User;
import com.opticrm.security.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentAllocationRepository allocationRepository;
    private final AccountRepository accountRepository;
    private final SecurityService securityService;

    @Transactional(readOnly = true)
    public Page<PaymentListDto> findAll(
            UUID accountId,
            Payment.PaymentStatus status,
            Payment.PaymentMethod paymentMethod,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {

        // COMMERCIAL ne voit que ses propres paiements
        if (ContextUtils.hasRole("COMMERCIAL")) {
            UUID uid = ContextUtils.getCurrentUserId().orElse(null);
            if (uid != null) {
                return paymentRepository.findByCreatedById(uid, pageable).map(this::toListDto);
            }
        }

        return paymentRepository.findWithFilters(accountId, status, paymentMethod, startDate, endDate, pageable)
                .map(this::toListDto);
    }

    @Transactional(readOnly = true)
    public Page<PaymentListDto> search(String search, Pageable pageable) {
        return paymentRepository.search(search, pageable).map(this::toListDto);
    }

    @Transactional(readOnly = true)
    public PaymentDto findById(UUID id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement non trouvé"));
        return toDto(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentListDto> findByAccountId(UUID accountId) {
        return paymentRepository.findByAccountId(accountId).stream()
                .map(this::toListDto)
                .collect(Collectors.toList());
    }

    public PaymentDto create(CreatePaymentRequest request) {
        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Compte non trouvé"));

        User currentUser = securityService.getCurrentUser();

        String paymentNumber = generatePaymentNumber();

        Payment payment = Payment.builder()
                .paymentNumber(paymentNumber)
                .account(account)
                .paymentDate(request.getPaymentDate())
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "MAD")
                .paymentMethod(request.getPaymentMethod())
                .reference(request.getReference())
                .bankAccount(request.getBankAccount())
                .status(request.getStatus() != null ? request.getStatus() : Payment.PaymentStatus.RECEIVED)
                .notes(request.getNotes())
                .createdBy(currentUser)
                .build();

        payment = paymentRepository.save(payment);
        return toDto(payment);
    }

    public PaymentDto update(UUID id, UpdatePaymentRequest request) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement non trouvé"));

        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Compte non trouvé"));

        // Check if amount can be reduced
        BigDecimal allocatedAmount = payment.getAllocatedAmount();
        if (request.getAmount().compareTo(allocatedAmount) < 0) {
            throw new ValidationException("Le montant ne peut pas être inférieur au montant déjà alloué (" + allocatedAmount + ")");
        }

        payment.setAccount(account);
        payment.setPaymentDate(request.getPaymentDate());
        payment.setAmount(request.getAmount());
        payment.setCurrency(request.getCurrency() != null ? request.getCurrency() : payment.getCurrency());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setReference(request.getReference());
        payment.setBankAccount(request.getBankAccount());
        if (request.getStatus() != null) {
            payment.setStatus(request.getStatus());
        }
        payment.setNotes(request.getNotes());

        payment = paymentRepository.save(payment);
        return toDto(payment);
    }

    public void delete(UUID id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement non trouvé"));

        if (!payment.getAllocations().isEmpty()) {
            throw new ValidationException("Impossible de supprimer un paiement avec des allocations. Supprimez d'abord les allocations.");
        }

        paymentRepository.delete(payment);
    }

    public PaymentAllocationDto allocate(UUID paymentId, CreateAllocationRequest request) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement non trouvé"));

        // Check if allocation already exists
        if (allocationRepository.existsByPaymentIdAndInvoiceId(paymentId, request.getInvoiceId())) {
            throw new ValidationException("Ce paiement est déjà alloué à cette facture");
        }

        // Check if amount exceeds unallocated amount
        BigDecimal unallocated = payment.getUnallocatedAmount();
        if (request.getAmount().compareTo(unallocated) > 0) {
            throw new ValidationException("Le montant d'allocation (" + request.getAmount() +
                    ") dépasse le montant non alloué (" + unallocated + ")");
        }

        PaymentAllocation allocation = PaymentAllocation.builder()
                .payment(payment)
                .invoiceId(request.getInvoiceId())
                .amount(request.getAmount())
                .build();

        allocation = allocationRepository.save(allocation);

        return PaymentAllocationDto.builder()
                .id(allocation.getId())
                .paymentId(payment.getId())
                .invoiceId(allocation.getInvoiceId())
                .amount(allocation.getAmount())
                .createdAt(allocation.getCreatedAt())
                .build();
    }

    public void removeAllocation(UUID paymentId, UUID allocationId) {
        PaymentAllocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> new ResourceNotFoundException("Allocation non trouvée"));

        if (!allocation.getPayment().getId().equals(paymentId)) {
            throw new ValidationException("L'allocation n'appartient pas à ce paiement");
        }

        allocationRepository.delete(allocation);
    }

    @Transactional(readOnly = true)
    public PaymentStatsDto getStats() {
        YearMonth currentMonth = YearMonth.now();
        LocalDate monthStart = currentMonth.atDay(1);
        LocalDate monthEnd = currentMonth.atEndOfMonth();
        LocalDate yearStart = LocalDate.of(currentMonth.getYear(), 1, 1);
        LocalDate today = LocalDate.now();

        long totalPayments = paymentRepository.count();
        BigDecimal totalAmount = paymentRepository.sumByDateRange(yearStart, today);
        BigDecimal monthlyAmount = paymentRepository.sumByDateRange(monthStart, monthEnd);
        long monthlyPayments = paymentRepository.countByDateRange(monthStart, monthEnd);

        // Count pending payments
        Page<PaymentListDto> pendingPage = findAll(null, Payment.PaymentStatus.PENDING, null, null, null, Pageable.unpaged());
        long pendingPayments = pendingPage.getTotalElements();
        BigDecimal pendingAmount = pendingPage.getContent().stream()
                .map(PaymentListDto::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return PaymentStatsDto.builder()
                .totalPayments(totalPayments)
                .totalAmount(totalAmount != null ? totalAmount : BigDecimal.ZERO)
                .monthlyAmount(monthlyAmount != null ? monthlyAmount : BigDecimal.ZERO)
                .monthlyPayments(monthlyPayments)
                .pendingPayments(pendingPayments)
                .pendingAmount(pendingAmount)
                .build();
    }

    private String generatePaymentNumber() {
        Integer maxNumber = paymentRepository.findMaxPaymentNumber();
        int nextNumber = (maxNumber != null ? maxNumber : 0) + 1;
        return String.format("PAY-%05d", nextNumber);
    }

    private PaymentDto toDto(Payment payment) {
        List<PaymentAllocationDto> allocations = payment.getAllocations().stream()
                .map(a -> PaymentAllocationDto.builder()
                        .id(a.getId())
                        .paymentId(payment.getId())
                        .invoiceId(a.getInvoiceId())
                        .amount(a.getAmount())
                        .createdAt(a.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return PaymentDto.builder()
                .id(payment.getId())
                .paymentNumber(payment.getPaymentNumber())
                .account(PaymentDto.AccountSummaryDto.builder()
                        .id(payment.getAccount().getId())
                        .name(payment.getAccount().getName())
                        .build())
                .paymentDate(payment.getPaymentDate())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .paymentMethod(payment.getPaymentMethod())
                .reference(payment.getReference())
                .bankAccount(payment.getBankAccount())
                .status(payment.getStatus())
                .notes(payment.getNotes())
                .createdBy(payment.getCreatedBy() != null ? PaymentDto.UserSummaryDto.builder()
                        .id(payment.getCreatedBy().getId())
                        .fullName(payment.getCreatedBy().getFullName())
                        .build() : null)
                .allocations(allocations)
                .allocatedAmount(payment.getAllocatedAmount())
                .unallocatedAmount(payment.getUnallocatedAmount())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }

    private PaymentListDto toListDto(Payment payment) {
        return PaymentListDto.builder()
                .id(payment.getId())
                .paymentNumber(payment.getPaymentNumber())
                .accountName(payment.getAccount().getName())
                .accountId(payment.getAccount().getId())
                .paymentDate(payment.getPaymentDate())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .paymentMethod(payment.getPaymentMethod())
                .reference(payment.getReference())
                .status(payment.getStatus())
                .allocatedAmount(payment.getAllocatedAmount())
                .unallocatedAmount(payment.getUnallocatedAmount())
                .createdByName(payment.getCreatedBy() != null ? payment.getCreatedBy().getFullName() : null)
                .build();
    }
}
