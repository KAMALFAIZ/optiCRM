package com.opticrm.core.objection.service;

import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.contact.entity.Contact;
import com.opticrm.core.contact.repository.ContactRepository;
import com.opticrm.core.objection.dto.*;
import com.opticrm.core.objection.entity.Objection;
import com.opticrm.core.objection.repository.ObjectionRepository;
import com.opticrm.core.opportunity.entity.Opportunity;
import com.opticrm.core.opportunity.repository.OpportunityRepository;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.UserRepository;
import com.opticrm.security.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ObjectionService {

    private final ObjectionRepository objectionRepository;
    private final ContactRepository contactRepository;
    private final AccountRepository accountRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;
    private final SecurityService securityService;

    @Transactional(readOnly = true)
    public Page<ObjectionListDto> findAll(
            Objection.ObjectionStatus status,
            Objection.ObjectionCategory category,
            Objection.ObjectionPriority priority,
            UUID assignedToId,
            UUID accountId,
            Pageable pageable) {

        return objectionRepository.findWithFilters(status, category, priority, assignedToId, accountId, pageable)
                .map(this::toListDto);
    }

    @Transactional(readOnly = true)
    public Page<ObjectionListDto> search(String search, Pageable pageable) {
        return objectionRepository.search(search, pageable).map(this::toListDto);
    }

    @Transactional(readOnly = true)
    public ObjectionDto findById(UUID id) {
        Objection objection = objectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Objection non trouvée"));
        return toDto(objection);
    }

    @Transactional(readOnly = true)
    public Page<ObjectionListDto> findByAccountId(UUID accountId, Pageable pageable) {
        return objectionRepository.findByAccountId(accountId, pageable).map(this::toListDto);
    }

    @Transactional(readOnly = true)
    public Page<ObjectionListDto> findByContactId(UUID contactId, Pageable pageable) {
        return objectionRepository.findByContactId(contactId, pageable).map(this::toListDto);
    }

    @Transactional(readOnly = true)
    public Page<ObjectionListDto> findByOpportunityId(UUID opportunityId, Pageable pageable) {
        return objectionRepository.findByOpportunityId(opportunityId, pageable).map(this::toListDto);
    }

    public ObjectionDto create(CreateObjectionRequest request) {
        User currentUser = securityService.getCurrentUser();
        String code = generateObjectionCode();

        Objection objection = Objection.builder()
                .code(code)
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .response(request.getResponse())
                .status(request.getStatus() != null ? request.getStatus() : Objection.ObjectionStatus.OPEN)
                .priority(request.getPriority() != null ? request.getPriority() : Objection.ObjectionPriority.MEDIUM)
                .source(request.getSource())
                .createdBy(currentUser)
                .build();

        // Set relations
        if (request.getContactId() != null) {
            Contact contact = contactRepository.findById(request.getContactId())
                    .orElseThrow(() -> new ResourceNotFoundException("Contact non trouvé"));
            objection.setContact(contact);
        }

        if (request.getAccountId() != null) {
            Account account = accountRepository.findById(request.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Compte non trouvé"));
            objection.setAccount(account);
        }

        if (request.getOpportunityId() != null) {
            Opportunity opportunity = opportunityRepository.findById(request.getOpportunityId())
                    .orElseThrow(() -> new ResourceNotFoundException("Opportunité non trouvée"));
            objection.setOpportunity(opportunity);
        }

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
            objection.setAssignedTo(assignedTo);
        }

        objection = objectionRepository.save(objection);
        return toDto(objection);
    }

    public ObjectionDto update(UUID id, UpdateObjectionRequest request) {
        Objection objection = objectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Objection non trouvée"));

        objection.setTitle(request.getTitle());
        objection.setDescription(request.getDescription());
        objection.setCategory(request.getCategory());
        objection.setResponse(request.getResponse());
        if (request.getStatus() != null) {
            objection.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            objection.setPriority(request.getPriority());
        }
        objection.setSource(request.getSource());

        // Update relations
        if (request.getContactId() != null) {
            Contact contact = contactRepository.findById(request.getContactId())
                    .orElseThrow(() -> new ResourceNotFoundException("Contact non trouvé"));
            objection.setContact(contact);
        } else {
            objection.setContact(null);
        }

        if (request.getAccountId() != null) {
            Account account = accountRepository.findById(request.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Compte non trouvé"));
            objection.setAccount(account);
        } else {
            objection.setAccount(null);
        }

        if (request.getOpportunityId() != null) {
            Opportunity opportunity = opportunityRepository.findById(request.getOpportunityId())
                    .orElseThrow(() -> new ResourceNotFoundException("Opportunité non trouvée"));
            objection.setOpportunity(opportunity);
        } else {
            objection.setOpportunity(null);
        }

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
            objection.setAssignedTo(assignedTo);
        } else {
            objection.setAssignedTo(null);
        }

        objection = objectionRepository.save(objection);
        return toDto(objection);
    }

    public ObjectionDto resolve(UUID id, ResolveObjectionRequest request) {
        Objection objection = objectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Objection non trouvée"));

        User currentUser = securityService.getCurrentUser();

        objection.setResponse(request.getResponse());
        objection.setStatus(Objection.ObjectionStatus.RESOLVED);
        objection.setResolvedAt(Instant.now());
        objection.setResolvedBy(currentUser);

        objection = objectionRepository.save(objection);
        return toDto(objection);
    }

    public void delete(UUID id) {
        Objection objection = objectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Objection non trouvée"));
        objectionRepository.delete(objection);
    }

    @Transactional(readOnly = true)
    public ObjectionStatsDto getStats() {
        long total = objectionRepository.count();
        long open = objectionRepository.countByStatus(Objection.ObjectionStatus.OPEN);
        long inProgress = objectionRepository.countByStatus(Objection.ObjectionStatus.IN_PROGRESS);
        long resolved = objectionRepository.countByStatus(Objection.ObjectionStatus.RESOLVED);
        long escalated = objectionRepository.countByStatus(Objection.ObjectionStatus.ESCALATED);

        Map<String, Long> byCategory = new HashMap<>();
        objectionRepository.countByCategories().forEach(row -> {
            if (row[0] != null) {
                byCategory.put(row[0].toString(), ((Number) row[1]).longValue());
            }
        });

        Map<String, Long> byStatus = new HashMap<>();
        objectionRepository.countByStatuses().forEach(row -> {
            if (row[0] != null) {
                byStatus.put(row[0].toString(), ((Number) row[1]).longValue());
            }
        });

        return ObjectionStatsDto.builder()
                .totalObjections(total)
                .openObjections(open)
                .inProgressObjections(inProgress)
                .resolvedObjections(resolved)
                .escalatedObjections(escalated)
                .byCategory(byCategory)
                .byStatus(byStatus)
                .build();
    }

    private String generateObjectionCode() {
        Integer maxNumber = objectionRepository.findMaxObjectionNumber();
        int nextNumber = (maxNumber != null ? maxNumber : 0) + 1;
        return String.format("OBJ-%05d", nextNumber);
    }

    private ObjectionDto toDto(Objection objection) {
        return ObjectionDto.builder()
                .id(objection.getId())
                .code(objection.getCode())
                .title(objection.getTitle())
                .description(objection.getDescription())
                .category(objection.getCategory())
                .response(objection.getResponse())
                .contact(objection.getContact() != null ? ObjectionDto.RelatedEntityDto.builder()
                        .id(objection.getContact().getId())
                        .name(objection.getContact().getFirstName() + " " + objection.getContact().getLastName())
                        .build() : null)
                .account(objection.getAccount() != null ? ObjectionDto.RelatedEntityDto.builder()
                        .id(objection.getAccount().getId())
                        .name(objection.getAccount().getName())
                        .build() : null)
                .opportunity(objection.getOpportunity() != null ? ObjectionDto.RelatedEntityDto.builder()
                        .id(objection.getOpportunity().getId())
                        .name(objection.getOpportunity().getName())
                        .build() : null)
                .status(objection.getStatus())
                .priority(objection.getPriority())
                .source(objection.getSource())
                .createdBy(objection.getCreatedBy() != null ? ObjectionDto.UserSummaryDto.builder()
                        .id(objection.getCreatedBy().getId())
                        .fullName(objection.getCreatedBy().getFullName())
                        .build() : null)
                .assignedTo(objection.getAssignedTo() != null ? ObjectionDto.UserSummaryDto.builder()
                        .id(objection.getAssignedTo().getId())
                        .fullName(objection.getAssignedTo().getFullName())
                        .build() : null)
                .resolvedAt(objection.getResolvedAt())
                .resolvedBy(objection.getResolvedBy() != null ? ObjectionDto.UserSummaryDto.builder()
                        .id(objection.getResolvedBy().getId())
                        .fullName(objection.getResolvedBy().getFullName())
                        .build() : null)
                .createdAt(objection.getCreatedAt())
                .updatedAt(objection.getUpdatedAt())
                .build();
    }

    private ObjectionListDto toListDto(Objection objection) {
        return ObjectionListDto.builder()
                .id(objection.getId())
                .code(objection.getCode())
                .title(objection.getTitle())
                .category(objection.getCategory())
                .status(objection.getStatus())
                .priority(objection.getPriority())
                .source(objection.getSource())
                .accountName(objection.getAccount() != null ? objection.getAccount().getName() : null)
                .accountId(objection.getAccount() != null ? objection.getAccount().getId() : null)
                .contactName(objection.getContact() != null ?
                        objection.getContact().getFirstName() + " " + objection.getContact().getLastName() : null)
                .contactId(objection.getContact() != null ? objection.getContact().getId() : null)
                .assignedToName(objection.getAssignedTo() != null ? objection.getAssignedTo().getFullName() : null)
                .assignedToId(objection.getAssignedTo() != null ? objection.getAssignedTo().getId() : null)
                .createdAt(objection.getCreatedAt())
                .resolvedAt(objection.getResolvedAt())
                .build();
    }
}
