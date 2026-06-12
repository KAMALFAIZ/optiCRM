package com.opticrm.core.visit.service;

import com.opticrm.common.dto.PageRequest;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.account.entity.Account;
import com.opticrm.security.config.ContextUtils;
import com.opticrm.common.exception.BusinessException;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.contact.entity.Contact;
import com.opticrm.core.contact.repository.ContactRepository;
import com.opticrm.core.visit.dto.*;
import com.opticrm.core.visit.entity.Visit;
import com.opticrm.core.visit.repository.VisitRepository;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VisitService {

    private final VisitRepository visitRepository;
    private final ContactRepository contactRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public VisitDto getById(UUID id) {
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visit", id));
        return mapToDto(visit);
    }

    @Transactional(readOnly = true)
    public Page<VisitListDto> list(PageRequest pageRequest, String search, String status,
                                    String visitType, String assignedToId) {
        Page<Visit> visits;

        // COMMERCIAL ne voit que ses propres visites
        if (ContextUtils.hasRole("COMMERCIAL")) {
            UUID currentUserId = ContextUtils.getCurrentUserId().orElse(null);
            if (currentUserId != null) {
                return visitRepository.findByAssignedToId(currentUserId,
                        pageRequest.toPageable("visitDate", Sort.Direction.DESC))
                        .map(this::mapToListDto);
            }
        }

        if (search != null && !search.isBlank()) {
            visits = visitRepository.search(search.trim(),
                    pageRequest.toPageable("visitDate", Sort.Direction.DESC));
        } else if (status != null && !status.isBlank()) {
            visits = visitRepository.findByStatus(status,
                    pageRequest.toPageable("visitDate", Sort.Direction.DESC));
        } else if (visitType != null && !visitType.isBlank()) {
            visits = visitRepository.findByVisitType(visitType,
                    pageRequest.toPageable("visitDate", Sort.Direction.DESC));
        } else if (assignedToId != null && !assignedToId.isBlank()) {
            visits = visitRepository.findByAssignedToId(UUID.fromString(assignedToId),
                    pageRequest.toPageable("visitDate", Sort.Direction.DESC));
        } else {
            visits = visitRepository.findAll(
                    pageRequest.toPageable("visitDate", Sort.Direction.DESC));
        }

        return visits.map(this::mapToListDto);
    }

    @Transactional(readOnly = true)
    public List<VisitListDto> getCalendarEvents(Instant from, Instant to, String assignedToId) {
        List<Visit> visits;

        // COMMERCIAL ne voit que son propre calendrier
        if (ContextUtils.hasRole("COMMERCIAL")) {
            UUID currentUserId = ContextUtils.getCurrentUserId().orElse(null);
            if (currentUserId != null) {
                return visitRepository.findByAssignedToAndDateRange(currentUserId, from, to)
                        .stream().map(this::mapToListDto).collect(Collectors.toList());
            }
        }

        if (assignedToId != null && !assignedToId.isBlank()) {
            visits = visitRepository.findByAssignedToAndDateRange(UUID.fromString(assignedToId), from, to);
        } else {
            visits = visitRepository.findByDateRange(from, to);
        }
        return visits.stream().map(this::mapToListDto).collect(Collectors.toList());
    }

    @Transactional
    public VisitDto create(CreateVisitRequest request) {
        UUID tenantId = ContextUtils.getCurrentTenantId()
                .orElseThrow(() -> new BusinessException("TENANT_MISSING", "Tenant non résolu"));

        Visit visit = Visit.builder()
                .tenantId(tenantId)
                .visitType(request.getVisitType())
                .subject(request.getSubject())
                .description(request.getDescription())
                .visitDate(request.getVisitDate())
                .visitEndDate(request.getVisitEndDate())
                .duration(calcDuration(request.getVisitDate(), request.getVisitEndDate(), request.getDuration()))
                .status(request.getStatus() != null ? request.getStatus() : "planned")
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .address(request.getAddress())
                .city(request.getCity())
                .notes(request.getNotes())
                .outcome(request.getOutcome())
                .nextAction(request.getNextAction())
                .objective(request.getObjective())
                .interestLevel(request.getInterestLevel())
                .satisfaction(request.getSatisfaction())
                .competitorDetected(request.getCompetitorDetected())
                .productsPresented(request.getProductsPresented())
                .estimatedAmount(request.getEstimatedAmount())
                .samplesDelivered(request.getSamplesDelivered())
                .transportMode(request.getTransportMode())
                .mileage(request.getMileage())
                .expenses(request.getExpenses())
                .followUpDate(request.getFollowUpDate())
                .followUpPriority(request.getFollowUpPriority())
                .nextVisitPlanned(request.getNextVisitPlanned())
                .build();

        if (request.getContactId() != null) {
            Contact contact = contactRepository.findById(UUID.fromString(request.getContactId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Contact", request.getContactId()));
            visit.setContact(contact);
        }

        if (request.getAccountId() != null) {
            Account account = accountRepository.findById(UUID.fromString(request.getAccountId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Account", request.getAccountId()));
            visit.setAccount(account);
        }

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(UUID.fromString(request.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("User", request.getAssignedToId()));
            visit.setAssignedTo(assignedTo);
        }

        visit = visitRepository.save(visit);
        log.info("Created visit: {}", visit.getSubject());
        return mapToDto(visit);
    }

    @Transactional
    public VisitDto update(UUID id, UpdateVisitRequest request) {
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visit", id));

        if (request.getVisitType() != null) visit.setVisitType(request.getVisitType());
        if (request.getSubject() != null) visit.setSubject(request.getSubject());
        if (request.getDescription() != null) visit.setDescription(request.getDescription());
        if (request.getVisitDate() != null) visit.setVisitDate(request.getVisitDate());
        if (request.getVisitEndDate() != null) visit.setVisitEndDate(request.getVisitEndDate());
        // Auto-recalculate duration when start or end date changes
        Instant startForCalc = request.getVisitDate() != null ? request.getVisitDate() : visit.getVisitDate();
        Instant endForCalc = request.getVisitEndDate() != null ? request.getVisitEndDate() : visit.getVisitEndDate();
        if (request.getVisitDate() != null || request.getVisitEndDate() != null) {
            visit.setDuration(calcDuration(startForCalc, endForCalc, request.getDuration()));
        } else if (request.getDuration() != null) {
            visit.setDuration(request.getDuration());
        }
        if (request.getStatus() != null) visit.setStatus(request.getStatus());
        if (request.getLatitude() != null) visit.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) visit.setLongitude(request.getLongitude());
        if (request.getAddress() != null) visit.setAddress(request.getAddress());
        if (request.getCity() != null) visit.setCity(request.getCity());
        if (request.getNotes() != null) visit.setNotes(request.getNotes());
        if (request.getOutcome() != null) visit.setOutcome(request.getOutcome());
        if (request.getNextAction() != null) visit.setNextAction(request.getNextAction());
        if (request.getObjective() != null) visit.setObjective(request.getObjective());
        if (request.getInterestLevel() != null) visit.setInterestLevel(request.getInterestLevel());
        if (request.getSatisfaction() != null) visit.setSatisfaction(request.getSatisfaction());
        if (request.getCompetitorDetected() != null) visit.setCompetitorDetected(request.getCompetitorDetected());
        if (request.getProductsPresented() != null) visit.setProductsPresented(request.getProductsPresented());
        if (request.getEstimatedAmount() != null) visit.setEstimatedAmount(request.getEstimatedAmount());
        if (request.getSamplesDelivered() != null) visit.setSamplesDelivered(request.getSamplesDelivered());
        if (request.getTransportMode() != null) visit.setTransportMode(request.getTransportMode());
        if (request.getMileage() != null) visit.setMileage(request.getMileage());
        if (request.getExpenses() != null) visit.setExpenses(request.getExpenses());
        if (request.getFollowUpDate() != null) visit.setFollowUpDate(request.getFollowUpDate());
        if (request.getFollowUpPriority() != null) visit.setFollowUpPriority(request.getFollowUpPriority());
        if (request.getNextVisitPlanned() != null) visit.setNextVisitPlanned(request.getNextVisitPlanned());

        if (request.getContactId() != null) {
            Contact contact = contactRepository.findById(UUID.fromString(request.getContactId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Contact", request.getContactId()));
            visit.setContact(contact);
        }

        if (request.getAccountId() != null) {
            Account account = accountRepository.findById(UUID.fromString(request.getAccountId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Account", request.getAccountId()));
            visit.setAccount(account);
        }

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(UUID.fromString(request.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("User", request.getAssignedToId()));
            visit.setAssignedTo(assignedTo);
        }

        visit = visitRepository.save(visit);
        log.info("Updated visit: {}", id);
        return mapToDto(visit);
    }

    @Transactional
    public void delete(UUID id) {
        if (!visitRepository.existsById(id)) {
            throw new ResourceNotFoundException("Visit", id);
        }
        visitRepository.deleteById(id);
        log.info("Deleted visit: {}", id);
    }

    @Transactional
    public VisitDto checkIn(UUID id, BigDecimal latitude, BigDecimal longitude) {
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visit", id));
        visit.setCheckInAt(Instant.now());
        visit.setStatus("in_progress");
        if (latitude != null) visit.setLatitude(latitude);
        if (longitude != null) visit.setLongitude(longitude);
        visit = visitRepository.save(visit);
        log.info("Check-in visit: {}", id);
        return mapToDto(visit);
    }

    @Transactional
    public VisitDto checkOut(UUID id, String notes, String outcome) {
        Visit visit = visitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visit", id));
        visit.setCheckOutAt(Instant.now());
        visit.setStatus("completed");
        if (notes != null) visit.setNotes(notes);
        if (outcome != null) visit.setOutcome(outcome);
        visit = visitRepository.save(visit);
        log.info("Check-out visit: {}", id);
        return mapToDto(visit);
    }

    private VisitDto mapToDto(Visit visit) {
        VisitDto.VisitDtoBuilder builder = VisitDto.builder()
                .id(visit.getId().toString())
                .visitType(visit.getVisitType())
                .subject(visit.getSubject())
                .description(visit.getDescription())
                .visitDate(visit.getVisitDate())
                .visitEndDate(visit.getVisitEndDate())
                .duration(visit.getDuration())
                .status(visit.getStatus())
                .latitude(visit.getLatitude())
                .longitude(visit.getLongitude())
                .address(visit.getAddress())
                .city(visit.getCity())
                .checkInAt(visit.getCheckInAt())
                .checkOutAt(visit.getCheckOutAt())
                .notes(visit.getNotes())
                .outcome(visit.getOutcome())
                .nextAction(visit.getNextAction())
                .objective(visit.getObjective())
                .interestLevel(visit.getInterestLevel())
                .satisfaction(visit.getSatisfaction())
                .competitorDetected(visit.getCompetitorDetected())
                .productsPresented(visit.getProductsPresented())
                .estimatedAmount(visit.getEstimatedAmount())
                .samplesDelivered(visit.getSamplesDelivered())
                .transportMode(visit.getTransportMode())
                .mileage(visit.getMileage())
                .expenses(visit.getExpenses())
                .followUpDate(visit.getFollowUpDate())
                .followUpPriority(visit.getFollowUpPriority())
                .nextVisitPlanned(visit.getNextVisitPlanned())
                .createdAt(visit.getCreatedAt())
                .updatedAt(visit.getUpdatedAt());

        if (visit.getContact() != null) {
            builder.contact(VisitDto.ContactSummary.builder()
                    .id(visit.getContact().getId().toString())
                    .fullName(visit.getContact().getDisplayName())
                    .email(visit.getContact().getEmail())
                    .build());
        }

        if (visit.getAccount() != null) {
            builder.account(VisitDto.AccountSummary.builder()
                    .id(visit.getAccount().getId().toString())
                    .name(visit.getAccount().getName())
                    .build());
        }

        if (visit.getAssignedTo() != null) {
            builder.assignedTo(VisitDto.UserSummary.builder()
                    .id(visit.getAssignedTo().getId().toString())
                    .fullName(visit.getAssignedTo().getFullName())
                    .email(visit.getAssignedTo().getEmail())
                    .build());
        }

        return builder.build();
    }

    private Integer calcDuration(Instant start, Instant end, Integer manual) {
        if (start != null && end != null && end.isAfter(start)) {
            return (int) Duration.between(start, end).toMinutes();
        }
        return manual;
    }

    private VisitListDto mapToListDto(Visit visit) {
        return VisitListDto.builder()
                .id(visit.getId().toString())
                .visitType(visit.getVisitType())
                .subject(visit.getSubject())
                .visitDate(visit.getVisitDate())
                .duration(visit.getDuration())
                .status(visit.getStatus())
                .address(visit.getAddress())
                .city(visit.getCity())
                .outcome(visit.getOutcome())
                .contactName(visit.getContact() != null ? visit.getContact().getDisplayName() : null)
                .accountName(visit.getAccount() != null ? visit.getAccount().getName() : null)
                .assignedToName(visit.getAssignedTo() != null ? visit.getAssignedTo().getFullName() : null)
                .checkInAt(visit.getCheckInAt())
                .checkOutAt(visit.getCheckOutAt())
                .createdAt(visit.getCreatedAt())
                .build();
    }
}
