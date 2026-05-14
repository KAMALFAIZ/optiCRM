package com.opticrm.finance.service;

import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.common.exception.ValidationException;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.finance.dto.*;
import com.opticrm.finance.entity.SalesOrder;
import com.opticrm.finance.entity.SalesOrderLine;
import com.opticrm.finance.repository.SalesOrderRepository;
import com.opticrm.security.config.ContextUtils;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.UserRepository;
import com.opticrm.security.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final SecurityService securityService;

    @Transactional(readOnly = true)
    public Page<SalesOrderListDto> findAll(
            UUID accountId,
            SalesOrder.OrderStatus status,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {

        // COMMERCIAL ne voit que ses propres commandes
        if (ContextUtils.hasRole("COMMERCIAL")) {
            UUID uid = ContextUtils.getCurrentUserId().orElse(null);
            if (uid != null) {
                return salesOrderRepository.findByAssignedToId(uid, pageable).map(this::toListDto);
            }
        }

        return salesOrderRepository.findWithFilters(accountId, status, startDate, endDate, pageable)
                .map(this::toListDto);
    }

    @Transactional(readOnly = true)
    public Page<SalesOrderListDto> search(String search, Pageable pageable) {
        return salesOrderRepository.search(search, pageable).map(this::toListDto);
    }

    @Transactional(readOnly = true)
    public SalesOrderDto findById(UUID id) {
        SalesOrder order = salesOrderRepository.findByIdWithLines(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande non trouvée"));
        return toDto(order);
    }

    @Transactional(readOnly = true)
    public List<SalesOrderListDto> findByAccountId(UUID accountId) {
        return salesOrderRepository.findByAccountId(accountId).stream()
                .map(this::toListDto)
                .collect(Collectors.toList());
    }

    public SalesOrderDto create(CreateSalesOrderRequest request) {
        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Compte non trouvé"));

        User currentUser = securityService.getCurrentUser();

        String orderNumber = generateOrderNumber();

        SalesOrder order = SalesOrder.builder()
                .orderNumber(orderNumber)
                .quoteId(request.getQuoteId())
                .account(account)
                .contactId(request.getContactId())
                .status(SalesOrder.OrderStatus.DRAFT)
                .orderDate(request.getOrderDate())
                .expectedDeliveryDate(request.getExpectedDeliveryDate())
                .subtotal(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .total(BigDecimal.ZERO)
                .currency(request.getCurrency() != null ? request.getCurrency() : "MAD")
                .shippingStreet(request.getShippingStreet())
                .shippingCity(request.getShippingCity())
                .shippingState(request.getShippingState())
                .shippingPostalCode(request.getShippingPostalCode())
                .shippingCountry(request.getShippingCountry())
                .notes(request.getNotes())
                .createdBy(currentUser)
                .build();

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur assigné non trouvé"));
            order.setAssignedTo(assignedTo);
        }

        // Handle lines
        if (request.getLines() != null && !request.getLines().isEmpty()) {
            List<SalesOrderLine> lines = buildLines(request.getLines(), order);
            order.getLines().addAll(lines);
            computeOrderTotals(order);
        } else {
            // Manual totals
            order.setSubtotal(request.getSubtotal() != null ? request.getSubtotal() : BigDecimal.ZERO);
            order.setDiscountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO);
            order.setTaxAmount(request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO);
            order.setTotal(request.getTotal() != null ? request.getTotal() : BigDecimal.ZERO);
        }

        order = salesOrderRepository.save(order);
        return toDto(order);
    }

    public SalesOrderDto update(UUID id, UpdateSalesOrderRequest request) {
        SalesOrder order = salesOrderRepository.findByIdWithLines(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande non trouvée"));

        if (order.getStatus() == SalesOrder.OrderStatus.CANCELLED) {
            throw new ValidationException("Impossible de modifier une commande annulée");
        }

        if (request.getStatus() != null) {
            order.setStatus(request.getStatus());
        }
        if (request.getContactId() != null) {
            order.setContactId(request.getContactId());
        }
        if (request.getOrderDate() != null) {
            order.setOrderDate(request.getOrderDate());
        }
        if (request.getExpectedDeliveryDate() != null) {
            order.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
        }
        if (request.getCurrency() != null) {
            order.setCurrency(request.getCurrency());
        }
        if (request.getShippingStreet() != null) {
            order.setShippingStreet(request.getShippingStreet());
        }
        if (request.getShippingCity() != null) {
            order.setShippingCity(request.getShippingCity());
        }
        if (request.getShippingState() != null) {
            order.setShippingState(request.getShippingState());
        }
        if (request.getShippingPostalCode() != null) {
            order.setShippingPostalCode(request.getShippingPostalCode());
        }
        if (request.getShippingCountry() != null) {
            order.setShippingCountry(request.getShippingCountry());
        }
        if (request.getNotes() != null) {
            order.setNotes(request.getNotes());
        }
        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur assigné non trouvé"));
            order.setAssignedTo(assignedTo);
        }

        // Handle lines update
        if (request.getLines() != null) {
            order.getLines().clear();
            if (!request.getLines().isEmpty()) {
                List<SalesOrderLine> lines = buildLines(request.getLines(), order);
                order.getLines().addAll(lines);
            }
            computeOrderTotals(order);
        } else {
            // Manual totals
            if (request.getSubtotal() != null) order.setSubtotal(request.getSubtotal());
            if (request.getDiscountAmount() != null) order.setDiscountAmount(request.getDiscountAmount());
            if (request.getTaxAmount() != null) order.setTaxAmount(request.getTaxAmount());
            if (request.getTotal() != null) order.setTotal(request.getTotal());
        }

        order = salesOrderRepository.save(order);
        return toDto(order);
    }

    public void delete(UUID id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande non trouvée"));

        if (order.getStatus() != SalesOrder.OrderStatus.DRAFT) {
            throw new ValidationException("Seule une commande en brouillon peut être supprimée");
        }

        salesOrderRepository.delete(order);
    }

    public SalesOrderDto confirm(UUID id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande non trouvée"));

        if (order.getStatus() != SalesOrder.OrderStatus.DRAFT) {
            throw new ValidationException("Seule une commande en brouillon peut être confirmée");
        }

        order.setStatus(SalesOrder.OrderStatus.CONFIRMED);
        order = salesOrderRepository.save(order);
        return toDto(order);
    }

    public SalesOrderDto ship(UUID id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande non trouvée"));

        if (order.getStatus() != SalesOrder.OrderStatus.CONFIRMED) {
            throw new ValidationException("Seule une commande confirmée peut être expédiée");
        }

        order.setStatus(SalesOrder.OrderStatus.SHIPPED);
        order = salesOrderRepository.save(order);
        return toDto(order);
    }

    public SalesOrderDto deliver(UUID id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande non trouvée"));

        if (order.getStatus() != SalesOrder.OrderStatus.SHIPPED) {
            throw new ValidationException("Seule une commande expédiée peut être livrée");
        }

        order.setStatus(SalesOrder.OrderStatus.DELIVERED);
        order = salesOrderRepository.save(order);
        return toDto(order);
    }

    public SalesOrderDto cancel(UUID id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande non trouvée"));

        if (order.getStatus() == SalesOrder.OrderStatus.DELIVERED) {
            throw new ValidationException("Impossible d'annuler une commande livrée");
        }

        order.setStatus(SalesOrder.OrderStatus.CANCELLED);
        order = salesOrderRepository.save(order);
        return toDto(order);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private List<SalesOrderLine> buildLines(List<CreateSalesOrderRequest.LineRequest> lineRequests, SalesOrder order) {
        List<SalesOrderLine> lines = new ArrayList<>();
        int idx = 0;
        for (CreateSalesOrderRequest.LineRequest req : lineRequests) {
            if (req.getProductName() == null || req.getProductName().isBlank()) continue;
            SalesOrderLine line = SalesOrderLine.builder()
                    .salesOrder(order)
                    .productId(req.getProductId())
                    .productCode(req.getProductCode())
                    .productName(req.getProductName())
                    .description(req.getDescription())
                    .quantity(req.getQuantity() != null ? req.getQuantity() : BigDecimal.ONE)
                    .unitPrice(req.getUnitPrice() != null ? req.getUnitPrice() : BigDecimal.ZERO)
                    .unitOfMeasure(req.getUnitOfMeasure() != null ? req.getUnitOfMeasure() : "unité")
                    .discountPercent(req.getDiscountPercent() != null ? req.getDiscountPercent() : BigDecimal.ZERO)
                    .taxRate(req.getTaxRate() != null ? req.getTaxRate() : BigDecimal.ZERO)
                    .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : idx)
                    .build();
            line.recalculate();
            lines.add(line);
            idx++;
        }
        return lines;
    }

    private void computeOrderTotals(SalesOrder order) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discountTotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        for (SalesOrderLine line : order.getLines()) {
            BigDecimal base = line.getUnitPrice().multiply(line.getQuantity()).setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(base);
            discountTotal = discountTotal.add(line.getDiscountAmount() != null ? line.getDiscountAmount() : BigDecimal.ZERO);
            taxTotal = taxTotal.add(line.getTaxAmount() != null ? line.getTaxAmount() : BigDecimal.ZERO);
        }

        order.setSubtotal(subtotal);
        order.setDiscountAmount(discountTotal);
        order.setTaxAmount(taxTotal);
        order.setTotal(subtotal.subtract(discountTotal).add(taxTotal));
    }

    private String generateOrderNumber() {
        Integer maxNumber = salesOrderRepository.findMaxOrderNumber();
        int nextNumber = (maxNumber != null ? maxNumber : 0) + 1;
        return String.format("CMD-%05d", nextNumber);
    }

    private SalesOrderDto toDto(SalesOrder order) {
        List<SalesOrderLineDto> lineDtos = order.getLines() != null
                ? order.getLines().stream().map(this::toLineDto).collect(Collectors.toList())
                : List.of();

        return SalesOrderDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .quoteId(order.getQuoteId())
                .account(SalesOrderDto.AccountSummaryDto.builder()
                        .id(order.getAccount().getId())
                        .name(order.getAccount().getName())
                        .build())
                .contactId(order.getContactId())
                .status(order.getStatus())
                .orderDate(order.getOrderDate())
                .expectedDeliveryDate(order.getExpectedDeliveryDate())
                .lines(lineDtos)
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .taxAmount(order.getTaxAmount())
                .total(order.getTotal())
                .currency(order.getCurrency())
                .shippingStreet(order.getShippingStreet())
                .shippingCity(order.getShippingCity())
                .shippingState(order.getShippingState())
                .shippingPostalCode(order.getShippingPostalCode())
                .shippingCountry(order.getShippingCountry())
                .notes(order.getNotes())
                .assignedTo(order.getAssignedTo() != null ? SalesOrderDto.UserSummaryDto.builder()
                        .id(order.getAssignedTo().getId())
                        .fullName(order.getAssignedTo().getFullName())
                        .build() : null)
                .createdBy(order.getCreatedBy() != null ? SalesOrderDto.UserSummaryDto.builder()
                        .id(order.getCreatedBy().getId())
                        .fullName(order.getCreatedBy().getFullName())
                        .build() : null)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private SalesOrderLineDto toLineDto(SalesOrderLine line) {
        return SalesOrderLineDto.builder()
                .id(line.getId())
                .productId(line.getProductId())
                .productCode(line.getProductCode())
                .productName(line.getProductName())
                .description(line.getDescription())
                .quantity(line.getQuantity())
                .unitPrice(line.getUnitPrice())
                .unitOfMeasure(line.getUnitOfMeasure())
                .discountPercent(line.getDiscountPercent())
                .discountAmount(line.getDiscountAmount())
                .taxRate(line.getTaxRate())
                .taxAmount(line.getTaxAmount())
                .lineTotal(line.getLineTotal())
                .sortOrder(line.getSortOrder())
                .build();
    }

    private SalesOrderListDto toListDto(SalesOrder order) {
        return SalesOrderListDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus())
                .accountName(order.getAccount().getName())
                .accountId(order.getAccount().getId())
                .orderDate(order.getOrderDate())
                .expectedDeliveryDate(order.getExpectedDeliveryDate())
                .total(order.getTotal())
                .currency(order.getCurrency())
                .assignedToName(order.getAssignedTo() != null ? order.getAssignedTo().getFullName() : null)
                .createdByName(order.getCreatedBy() != null ? order.getCreatedBy().getFullName() : null)
                .build();
    }
}
