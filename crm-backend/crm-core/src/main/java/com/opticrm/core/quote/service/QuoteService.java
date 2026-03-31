package com.opticrm.core.quote.service;

import com.opticrm.common.dto.PageRequest;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.chantier.entity.Chantier;
import com.opticrm.core.chantier.repository.ChantierRepository;
import com.opticrm.core.contact.entity.Contact;
import com.opticrm.core.contact.repository.ContactRepository;
import com.opticrm.core.opportunity.entity.Opportunity;
import com.opticrm.core.opportunity.repository.OpportunityRepository;
import com.opticrm.core.quote.dto.*;
import com.opticrm.core.quote.entity.Quote;
import com.opticrm.core.quote.entity.Quote.QuoteStatus;
import com.opticrm.core.quote.entity.QuoteLineItem;
import com.opticrm.core.quote.repository.QuoteRepository;
import com.opticrm.security.config.ContextUtils;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuoteService {

    private final QuoteRepository quoteRepository;
    private final AccountRepository accountRepository;
    private final ChantierRepository chantierRepository;
    private final ContactRepository contactRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<QuoteListDto> list(PageRequest pageRequest, String search, String status, String accountId, String assignedToId) {
        // COMMERCIAL ne voit que ses propres devis
        if (ContextUtils.hasRole("COMMERCIAL")) {
            UUID uid = ContextUtils.getCurrentUserId().orElse(null);
            if (uid != null) assignedToId = uid.toString();
        }

        Sort sort = Sort.by(
                pageRequest.getSortDirection().equalsIgnoreCase("desc")
                        ? Sort.Direction.DESC : Sort.Direction.ASC,
                pageRequest.getSortBy() != null ? pageRequest.getSortBy() : "createdAt"
        );

        Pageable pageable = org.springframework.data.domain.PageRequest.of(
                pageRequest.getPage() - 1,
                pageRequest.getPerPage(),
                sort
        );

        QuoteStatus quoteStatus = status != null ? QuoteStatus.valueOf(status.toUpperCase()) : null;
        UUID accountUuid = accountId != null ? UUID.fromString(accountId) : null;
        UUID assignedToUuid = assignedToId != null ? UUID.fromString(assignedToId) : null;

        return quoteRepository.findAllWithFilters(search, quoteStatus, accountUuid, assignedToUuid, pageable)
                .map(this::mapToListDto);
    }

    @Transactional(readOnly = true)
    public QuoteDto getById(UUID id) {
        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Devis non trouvé avec l'id: " + id));
        return mapToDto(quote);
    }

    @Transactional
    public QuoteDto create(CreateQuoteRequest request) {
        Account account = accountRepository.findById(UUID.fromString(request.getAccountId()))
                .orElseThrow(() -> new ResourceNotFoundException("Compte non trouvé"));

        Quote quote = Quote.builder()
                .quoteNumber(generateQuoteNumber())
                .status(QuoteStatus.DRAFT)
                .account(account)
                .quoteDate(request.getQuoteDate() != null ? request.getQuoteDate() : LocalDate.now())
                .validUntil(request.getValidUntil())
                .currency(request.getCurrency() != null ? request.getCurrency() : "MAD")
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .discountAmount(request.getDiscountAmount())
                .termsAndConditions(request.getTerms())
                .notes(request.getNotes())
                .billingStreet(request.getBillingAddress())
                .shippingStreet(request.getShippingAddress())
                .lineItems(new ArrayList<>())
                .build();

        if (request.getContactId() != null) {
            Contact contact = contactRepository.findById(UUID.fromString(request.getContactId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Contact non trouvé"));
            quote.setContact(contact);
        }

        if (request.getOpportunityId() != null) {
            Opportunity opportunity = opportunityRepository.findById(UUID.fromString(request.getOpportunityId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Opportunité non trouvée"));
            quote.setOpportunity(opportunity);
        }

        if (request.getChantierId() != null) {
            Chantier chantier = chantierRepository.findById(UUID.fromString(request.getChantierId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Chantier non trouvé"));
            quote.setChantier(chantier);
        }

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(UUID.fromString(request.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
            quote.setAssignedTo(assignedTo);
        } else if (ContextUtils.hasRole("COMMERCIAL")) {
            UUID currentUserId = ContextUtils.getCurrentUserId().orElse(null);
            if (currentUserId != null) {
                User currentUser = userRepository.findById(currentUserId).orElse(null);
                if (currentUser != null) {
                    quote.setAssignedTo(currentUser);
                    log.info("Auto-assigned quote to commercial '{}'", currentUser.getEmail());
                }
            }
        }

        // Add line items
        if (request.getLineItems() != null) {
            int sortOrder = 0;
            for (CreateQuoteRequest.LineItemRequest itemRequest : request.getLineItems()) {
                QuoteLineItem lineItem = QuoteLineItem.builder()
                        .productName(itemRequest.getName())
                        .description(itemRequest.getDescription())
                        .productCode(itemRequest.getSku())
                        .quantity(itemRequest.getQuantity())
                        .unitOfMeasure(itemRequest.getUnit() != null ? itemRequest.getUnit() : "unité")
                        .unitPrice(itemRequest.getUnitPrice())
                        .discountType(itemRequest.getDiscountPercent() != null && itemRequest.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0 ? "percentage" : null)
                        .discountValue(itemRequest.getDiscountPercent())
                        .discountAmount(itemRequest.getDiscountAmount())
                        .taxRate(itemRequest.getTaxPercent())
                        .sortOrder(itemRequest.getSortOrder() != null ? itemRequest.getSortOrder() : sortOrder++)
                        .build();

                if (itemRequest.getProductId() != null) {
                    lineItem.setProductId(UUID.fromString(itemRequest.getProductId()));
                }

                quote.addLineItem(lineItem);
            }
        }

        quote.recalculateTotals();
        quote = quoteRepository.save(quote);
        log.info("Created quote: {} - {}", quote.getId(), quote.getQuoteNumber());

        return mapToDto(quote);
    }

    @Transactional
    public QuoteDto update(UUID id, UpdateQuoteRequest request) {
        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Devis non trouvé avec l'id: " + id));

        if (request.getStatus() != null) quote.setStatus(QuoteStatus.valueOf(request.getStatus().toUpperCase()));
        if (request.getQuoteDate() != null) quote.setQuoteDate(request.getQuoteDate());
        if (request.getValidUntil() != null) quote.setValidUntil(request.getValidUntil());
        if (request.getCurrency() != null) quote.setCurrency(request.getCurrency());
        if (request.getDiscountType() != null) quote.setDiscountType(request.getDiscountType());
        if (request.getDiscountValue() != null) quote.setDiscountValue(request.getDiscountValue());
        if (request.getDiscountAmount() != null) quote.setDiscountAmount(request.getDiscountAmount());
        if (request.getTerms() != null) quote.setTermsAndConditions(request.getTerms());
        if (request.getNotes() != null) quote.setNotes(request.getNotes());
        if (request.getBillingAddress() != null) quote.setBillingStreet(request.getBillingAddress());
        if (request.getShippingAddress() != null) quote.setShippingStreet(request.getShippingAddress());

        if (request.getAccountId() != null) {
            Account account = accountRepository.findById(UUID.fromString(request.getAccountId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Compte non trouvé"));
            quote.setAccount(account);
        }

        if (request.getContactId() != null) {
            Contact contact = contactRepository.findById(UUID.fromString(request.getContactId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Contact non trouvé"));
            quote.setContact(contact);
        }

        if (request.getOpportunityId() != null) {
            Opportunity opportunity = opportunityRepository.findById(UUID.fromString(request.getOpportunityId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Opportunité non trouvée"));
            quote.setOpportunity(opportunity);
        }

        if (request.getChantierId() != null) {
            Chantier chantier = chantierRepository.findById(UUID.fromString(request.getChantierId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Chantier non trouvé"));
            quote.setChantier(chantier);
        }

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(UUID.fromString(request.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
            quote.setAssignedTo(assignedTo);
        }

        // Update line items if provided
        if (request.getLineItems() != null) {
            quote.getLineItems().clear();
            int sortOrder = 0;
            for (UpdateQuoteRequest.LineItemRequest itemRequest : request.getLineItems()) {
                QuoteLineItem lineItem = QuoteLineItem.builder()
                        .productName(itemRequest.getName())
                        .description(itemRequest.getDescription())
                        .productCode(itemRequest.getSku())
                        .quantity(itemRequest.getQuantity())
                        .unitOfMeasure(itemRequest.getUnit() != null ? itemRequest.getUnit() : "unité")
                        .unitPrice(itemRequest.getUnitPrice())
                        .discountType(itemRequest.getDiscountPercent() != null && itemRequest.getDiscountPercent().compareTo(BigDecimal.ZERO) > 0 ? "percentage" : null)
                        .discountValue(itemRequest.getDiscountPercent())
                        .discountAmount(itemRequest.getDiscountAmount())
                        .taxRate(itemRequest.getTaxPercent())
                        .sortOrder(itemRequest.getSortOrder() != null ? itemRequest.getSortOrder() : sortOrder++)
                        .build();

                if (itemRequest.getProductId() != null) {
                    lineItem.setProductId(UUID.fromString(itemRequest.getProductId()));
                }

                quote.addLineItem(lineItem);
            }
        }

        quote.recalculateTotals();
        quote = quoteRepository.save(quote);
        log.info("Updated quote: {}", quote.getId());

        return mapToDto(quote);
    }

    @Transactional
    public void delete(UUID id) {
        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Devis non trouvé avec l'id: " + id));

        quoteRepository.delete(quote);
        log.info("Deleted quote: {}", id);
    }

    @Transactional(readOnly = true)
    public List<QuoteListDto> getByAccount(UUID accountId) {
        return quoteRepository.findByAccountId(accountId).stream()
                .map(this::mapToListDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<QuoteListDto> getByChantier(UUID chantierId) {
        return quoteRepository.findByChantierIdOrderByCreatedAtDesc(chantierId).stream()
                .map(this::mapToListDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<QuoteListDto> getByOpportunity(UUID opportunityId) {
        return quoteRepository.findByOpportunityId(opportunityId).stream()
                .map(this::mapToListDto)
                .toList();
    }

    @Transactional
    public QuoteDto updateStatus(UUID id, String status) {
        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Devis non trouvé avec l'id: " + id));

        quote.setStatus(QuoteStatus.valueOf(status.toUpperCase()));
        quote = quoteRepository.save(quote);
        log.info("Updated quote status: {} -> {}", id, status);

        return mapToDto(quote);
    }

    @Transactional
    public QuoteDto duplicate(UUID id) {
        Quote original = quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Devis non trouvé avec l'id: " + id));

        Quote copy = Quote.builder()
                .quoteNumber(generateQuoteNumber())
                .status(QuoteStatus.DRAFT)
                .account(original.getAccount())
                .contact(original.getContact())
                .opportunity(original.getOpportunity())
                .chantier(original.getChantier())
                .assignedTo(original.getAssignedTo())
                .quoteDate(LocalDate.now())
                .validUntil(LocalDate.now().plusDays(30))
                .currency(original.getCurrency())
                .discountType(original.getDiscountType())
                .discountValue(original.getDiscountValue())
                .discountAmount(original.getDiscountAmount())
                .termsAndConditions(original.getTermsAndConditions())
                .notes(original.getNotes())
                .billingStreet(original.getBillingStreet())
                .shippingStreet(original.getShippingStreet())
                .lineItems(new ArrayList<>())
                .build();

        // Copy line items
        int sortOrder = 0;
        for (QuoteLineItem originalItem : original.getLineItems()) {
            QuoteLineItem itemCopy = QuoteLineItem.builder()
                    .productId(originalItem.getProductId())
                    .productName(originalItem.getProductName())
                    .productCode(originalItem.getProductCode())
                    .description(originalItem.getDescription())
                    .quantity(originalItem.getQuantity())
                    .unitOfMeasure(originalItem.getUnitOfMeasure())
                    .unitPrice(originalItem.getUnitPrice())
                    .discountType(originalItem.getDiscountType())
                    .discountValue(originalItem.getDiscountValue())
                    .discountAmount(originalItem.getDiscountAmount())
                    .taxRate(originalItem.getTaxRate())
                    .sortOrder(sortOrder++)
                    .build();
            copy.addLineItem(itemCopy);
        }

        copy.recalculateTotals();
        copy = quoteRepository.save(copy);
        log.info("Duplicated quote: {} -> {}", id, copy.getId());

        return mapToDto(copy);
    }

    private String generateQuoteNumber() {
        String prefix = "DEV" + Year.now().getValue();
        Integer maxNumber = quoteRepository.findMaxQuoteNumberByPrefix(prefix);
        int nextNumber = (maxNumber != null ? maxNumber : 0) + 1;
        return prefix + String.format("%05d", nextNumber);
    }

    private QuoteListDto mapToListDto(Quote quote) {
        return QuoteListDto.builder()
                .id(quote.getId().toString())
                .quoteNumber(quote.getQuoteNumber())
                .name(quote.getName())
                .status(quote.getStatus().name())
                .accountId(quote.getAccount().getId().toString())
                .accountName(quote.getAccount().getName())
                .contactId(quote.getContact() != null ? quote.getContact().getId().toString() : null)
                .contactName(quote.getContact() != null ? quote.getContact().getFullName() : null)
                .opportunityId(quote.getOpportunity() != null ? quote.getOpportunity().getId().toString() : null)
                .opportunityName(quote.getOpportunity() != null ? quote.getOpportunity().getName() : null)
                .chantierId(quote.getChantier() != null ? quote.getChantier().getId().toString() : null)
                .chantierNom(quote.getChantier() != null ? quote.getChantier().getNom() : null)
                .assignedToId(quote.getAssignedTo() != null ? quote.getAssignedTo().getId().toString() : null)
                .assignedToName(quote.getAssignedTo() != null ? quote.getAssignedTo().getFirstName() + " " + quote.getAssignedTo().getLastName() : null)
                .quoteDate(quote.getQuoteDate())
                .validUntil(quote.getValidUntil())
                .currency(quote.getCurrency())
                .subtotal(quote.getSubtotal())
                .total(quote.getTotal())
                .itemCount(quote.getLineItems().size())
                .createdAt(quote.getCreatedAt())
                .build();
    }

    private QuoteDto mapToDto(Quote quote) {
        QuoteDto.QuoteDtoBuilder builder = QuoteDto.builder()
                .id(quote.getId().toString())
                .quoteNumber(quote.getQuoteNumber())
                .name(quote.getName())
                .status(quote.getStatus().name())
                .quoteDate(quote.getQuoteDate())
                .validUntil(quote.getValidUntil())
                .currency(quote.getCurrency())
                .subtotal(quote.getSubtotal())
                .discountType(quote.getDiscountType())
                .discountValue(quote.getDiscountValue())
                .discountAmount(quote.getDiscountAmount())
                .taxAmount(quote.getTaxAmount())
                .total(quote.getTotal())
                .terms(quote.getTermsAndConditions())
                .notes(quote.getNotes())
                .billingAddress(quote.getBillingStreet())
                .shippingAddress(quote.getShippingStreet())
                .createdAt(quote.getCreatedAt())
                .updatedAt(quote.getUpdatedAt());

        builder.account(QuoteDto.AccountInfo.builder()
                .id(quote.getAccount().getId().toString())
                .name(quote.getAccount().getName())
                .build());

        if (quote.getContact() != null) {
            builder.contact(QuoteDto.ContactInfo.builder()
                    .id(quote.getContact().getId().toString())
                    .fullName(quote.getContact().getFullName())
                    .email(quote.getContact().getEmail())
                    .phone(quote.getContact().getPhoneMobile())
                    .build());
        }

        if (quote.getOpportunity() != null) {
            builder.opportunity(QuoteDto.OpportunityInfo.builder()
                    .id(quote.getOpportunity().getId().toString())
                    .name(quote.getOpportunity().getName())
                    .build());
        }

        if (quote.getChantier() != null) {
            builder.chantier(QuoteDto.ChantierInfo.builder()
                    .id(quote.getChantier().getId().toString())
                    .nom(quote.getChantier().getNom())
                    .ville(quote.getChantier().getVille())
                    .build());
        }

        if (quote.getAssignedTo() != null) {
            builder.assignedTo(QuoteDto.UserInfo.builder()
                    .id(quote.getAssignedTo().getId().toString())
                    .fullName(quote.getAssignedTo().getFirstName() + " " + quote.getAssignedTo().getLastName())
                    .email(quote.getAssignedTo().getEmail())
                    .build());
        }

        // Map line items
        List<QuoteLineItemDto> lineItemDtos = quote.getLineItems().stream()
                .map(item -> QuoteLineItemDto.builder()
                        .id(item.getId().toString())
                        .productId(item.getProductId() != null ? item.getProductId().toString() : null)
                        .name(item.getProductName())
                        .description(item.getDescription())
                        .sku(item.getProductCode())
                        .quantity(item.getQuantity())
                        .unit(item.getUnitOfMeasure())
                        .unitPrice(item.getUnitPrice())
                        .discountPercent(item.getDiscountValue())
                        .discountAmount(item.getDiscountAmount())
                        .taxPercent(item.getTaxRate())
                        .lineTotal(item.getTotal())
                        .sortOrder(item.getSortOrder())
                        .build())
                .toList();
        builder.lineItems(lineItemDtos);

        return builder.build();
    }
}
