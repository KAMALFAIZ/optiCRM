package com.opticrm.core.opportunity.service;

import com.opticrm.common.dto.PageRequest;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.contact.entity.Contact;
import com.opticrm.core.contact.repository.ContactRepository;
import com.opticrm.core.lead.entity.Lead;
import com.opticrm.core.lead.repository.LeadRepository;
import com.opticrm.core.opportunity.dto.*;
import com.opticrm.core.opportunity.entity.Opportunity;
import com.opticrm.core.opportunity.entity.OpportunityStage;
import com.opticrm.core.opportunity.repository.OpportunityRepository;
import com.opticrm.core.opportunity.repository.OpportunityStageRepository;
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
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OpportunityService {

    private final OpportunityRepository opportunityRepository;
    private final OpportunityStageRepository stageRepository;
    private final AccountRepository accountRepository;
    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
    private final LeadRepository leadRepository;

    @Transactional(readOnly = true)
    public List<OpportunityStageDto> getAllStages() {
        return stageRepository.findAllOrdered().stream()
                .map(this::mapToStageDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<OpportunityListDto> list(PageRequest pageRequest, String search, String stageId, String accountId, String assignedToId, Boolean isClosed) {
        // COMMERCIAL ne voit que ses propres opportunités
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

        UUID stageUuid = stageId != null ? UUID.fromString(stageId) : null;
        UUID accountUuid = accountId != null ? UUID.fromString(accountId) : null;
        UUID assignedToUuid = assignedToId != null ? UUID.fromString(assignedToId) : null;

        return opportunityRepository.findAllWithFilters(search, stageUuid, accountUuid, assignedToUuid, isClosed, pageable)
                .map(this::mapToListDto);
    }

    @Transactional(readOnly = true)
    public OpportunityDto getById(UUID id) {
        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with id: " + id));
        return mapToDto(opportunity);
    }

    @Transactional
    public OpportunityDto create(CreateOpportunityRequest request) {
        OpportunityStage stage = stageRepository.findById(UUID.fromString(request.getStageId()))
                .orElseThrow(() -> new ResourceNotFoundException("Stage not found"));

        Account account = accountRepository.findById(UUID.fromString(request.getAccountId()))
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        Opportunity opportunity = Opportunity.builder()
                .name(request.getName())
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "MAD")
                .probability(request.getProbability() != null ? request.getProbability() : stage.getProbability())
                .stage(stage)
                .stageChangedAt(Instant.now())
                .closeDate(request.getCloseDate())
                .type(request.getType())
                .leadSource(request.getLeadSource())
                .account(account)
                .description(request.getDescription())
                .nextStep(request.getNextStep())
                .tags(request.getTags())
                .isClosed(false)
                .build();

        if (request.getPrimaryContactId() != null) {
            Contact contact = contactRepository.findById(UUID.fromString(request.getPrimaryContactId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Contact not found"));
            opportunity.setPrimaryContact(contact);
        }

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(UUID.fromString(request.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            opportunity.setAssignedTo(assignedTo);
        } else if (ContextUtils.hasRole("COMMERCIAL")) {
            UUID currentUserId = ContextUtils.getCurrentUserId().orElse(null);
            if (currentUserId != null) {
                User currentUser = userRepository.findById(currentUserId).orElse(null);
                if (currentUser != null) {
                    opportunity.setAssignedTo(currentUser);
                    log.info("Auto-assigned opportunity to commercial '{}'", currentUser.getEmail());
                }
            }
        }

        if (request.getLeadId() != null) {
            Lead lead = leadRepository.findById(UUID.fromString(request.getLeadId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
            opportunity.setLead(lead);
        }

        if (request.getCampaignId() != null) {
            opportunity.setCampaignId(UUID.fromString(request.getCampaignId()));
        }

        opportunity = opportunityRepository.save(opportunity);
        log.info("Created opportunity: {} - {}", opportunity.getId(), opportunity.getName());

        return mapToDto(opportunity);
    }

    @Transactional
    public OpportunityDto update(UUID id, UpdateOpportunityRequest request) {
        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with id: " + id));

        // Optimistic locking
        if (request.getVersion() != null) {
            opportunity.setVersion(request.getVersion());
        }

        if (request.getName() != null) opportunity.setName(request.getName());
        if (request.getAmount() != null) opportunity.setAmount(request.getAmount());
        if (request.getCurrency() != null) opportunity.setCurrency(request.getCurrency());
        if (request.getProbability() != null) opportunity.setProbability(request.getProbability());
        if (request.getCloseDate() != null) opportunity.setCloseDate(request.getCloseDate());
        if (request.getType() != null) opportunity.setType(request.getType());
        if (request.getLeadSource() != null) opportunity.setLeadSource(request.getLeadSource());
        if (request.getDescription() != null) opportunity.setDescription(request.getDescription());
        if (request.getNextStep() != null) opportunity.setNextStep(request.getNextStep());
        if (request.getTags() != null) opportunity.setTags(request.getTags());

        if (request.getStageId() != null) {
            OpportunityStage newStage = stageRepository.findById(UUID.fromString(request.getStageId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Stage not found"));

            if (!newStage.getId().equals(opportunity.getStage().getId())) {
                opportunity.setStage(newStage);
                opportunity.setStageChangedAt(Instant.now());

                // Update closed status based on stage
                if (newStage.getIsClosed()) {
                    opportunity.setIsClosed(true);
                    opportunity.setIsWon(newStage.getIsWon());
                    opportunity.setActualCloseDate(LocalDate.now());
                }
            }
        }

        if (request.getAccountId() != null) {
            Account account = accountRepository.findById(UUID.fromString(request.getAccountId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
            opportunity.setAccount(account);
        }

        if (request.getPrimaryContactId() != null) {
            Contact contact = contactRepository.findById(UUID.fromString(request.getPrimaryContactId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Contact not found"));
            opportunity.setPrimaryContact(contact);
        }

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(UUID.fromString(request.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            opportunity.setAssignedTo(assignedTo);
        }

        if (request.getIsClosed() != null) {
            opportunity.setIsClosed(request.getIsClosed());
            if (request.getIsClosed()) {
                opportunity.setActualCloseDate(LocalDate.now());
            }
        }

        if (request.getIsWon() != null) opportunity.setIsWon(request.getIsWon());
        if (request.getCloseReason() != null) opportunity.setCloseReason(request.getCloseReason());
        if (request.getCompetitorId() != null) opportunity.setCompetitorId(UUID.fromString(request.getCompetitorId()));

        opportunity = opportunityRepository.save(opportunity);
        log.info("Updated opportunity: {}", opportunity.getId());

        return mapToDto(opportunity);
    }

    @Transactional
    public void delete(UUID id) {
        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found with id: " + id));

        opportunityRepository.delete(opportunity);
        log.info("Deleted opportunity: {}", id);
    }

    @Transactional(readOnly = true)
    public List<OpportunityListDto> getByAccount(UUID accountId) {
        return opportunityRepository.findByAccountId(accountId).stream()
                .map(this::mapToListDto)
                .toList();
    }

    // ---- Pipeline Kanban ----

    /**
     * Retourne la vue pipeline groupée par étape avec prévision de revenus.
     * @param assignedToId filtre optionnel par commercial assigné
     */
    @Transactional(readOnly = true)
    public PipelineSummaryDto getPipeline(String assignedToId) {
        List<OpportunityStage> stages = stageRepository.findAllOrdered();
        UUID assignedToUuid = assignedToId != null && !assignedToId.isBlank()
                ? UUID.fromString(assignedToId) : null;

        List<Opportunity> allOpps = opportunityRepository.findOpenOpportunitiesForPipeline(assignedToUuid);

        BigDecimal totalPipeline  = BigDecimal.ZERO;
        BigDecimal totalWeighted  = BigDecimal.ZERO;
        BigDecimal commitAmount   = BigDecimal.ZERO;
        BigDecimal bestCaseAmount = BigDecimal.ZERO;
        BigDecimal pipelineAmount = BigDecimal.ZERO;
        int totalCount = 0;

        List<PipelineStageDto> stageDtos = new ArrayList<>();

        for (OpportunityStage stage : stages) {
            if (Boolean.TRUE.equals(stage.getIsClosed())) continue; // Ignore Won/Lost

            List<Opportunity> stageOpps = allOpps.stream()
                    .filter(o -> o.getStage().getId().equals(stage.getId()))
                    .collect(Collectors.toList());

            BigDecimal stageTotal = stageOpps.stream()
                    .map(o -> o.getAmount() != null ? o.getAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal stageWeighted = stageOpps.stream()
                    .map(Opportunity::getWeightedAmountCalculated)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            stageDtos.add(PipelineStageDto.builder()
                    .id(stage.getId().toString())
                    .name(stage.getName())
                    .code(stage.getCode())
                    .color(stage.getColor())
                    .sortOrder(stage.getSortOrder())
                    .isClosed(stage.getIsClosed())
                    .isWon(stage.getIsWon())
                    .probability(stage.getProbability())
                    .opportunities(stageOpps.stream().map(this::mapToListDto).collect(Collectors.toList()))
                    .count(stageOpps.size())
                    .totalAmount(stageTotal)
                    .weightedAmount(stageWeighted)
                    .build());

            totalPipeline = totalPipeline.add(stageTotal);
            totalWeighted = totalWeighted.add(stageWeighted);
            totalCount += stageOpps.size();

            // Catégories de prévision
            for (Opportunity opp : stageOpps) {
                BigDecimal amt = opp.getAmount() != null ? opp.getAmount() : BigDecimal.ZERO;
                int prob = opp.getProbability() != null ? opp.getProbability() : 0;
                if (prob >= 80)      commitAmount   = commitAmount.add(amt);
                else if (prob >= 50) bestCaseAmount = bestCaseAmount.add(amt);
                else                 pipelineAmount = pipelineAmount.add(amt);
            }
        }

        return PipelineSummaryDto.builder()
                .stages(stageDtos)
                .totalPipeline(totalPipeline)
                .totalWeighted(totalWeighted)
                .commitAmount(commitAmount)
                .bestCaseAmount(bestCaseAmount)
                .pipelineAmount(pipelineAmount)
                .totalCount(totalCount)
                .build();
    }

    /**
     * Déplace une opportunité vers une nouvelle étape (drag & drop Kanban).
     */
    @Transactional
    public OpportunityListDto moveToStage(UUID id, MoveStageRequest request) {
        Opportunity opportunity = opportunityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found: " + id));

        OpportunityStage newStage = stageRepository.findById(UUID.fromString(request.getStageId()))
                .orElseThrow(() -> new ResourceNotFoundException("Stage not found: " + request.getStageId()));

        if (!newStage.getId().equals(opportunity.getStage().getId())) {
            opportunity.setStage(newStage);
            opportunity.setStageChangedAt(Instant.now());
            opportunity.setProbability(newStage.getProbability());

            if (Boolean.TRUE.equals(newStage.getIsClosed())) {
                opportunity.setIsClosed(true);
                opportunity.setIsWon(newStage.getIsWon());
                opportunity.setActualCloseDate(LocalDate.now());
            }
        }

        opportunity = opportunityRepository.save(opportunity);
        log.info("Moved opportunity {} to stage {}", id, newStage.getName());
        return mapToListDto(opportunity);
    }

    private OpportunityStageDto mapToStageDto(OpportunityStage stage) {
        return OpportunityStageDto.builder()
                .id(stage.getId().toString())
                .name(stage.getName())
                .code(stage.getCode())
                .probability(stage.getProbability())
                .sortOrder(stage.getSortOrder())
                .isClosed(stage.getIsClosed())
                .isWon(stage.getIsWon())
                .color(stage.getColor())
                .build();
    }

    private OpportunityListDto mapToListDto(Opportunity opp) {
        return OpportunityListDto.builder()
                .id(opp.getId().toString())
                .name(opp.getName())
                .amount(opp.getAmount())
                .currency(opp.getCurrency())
                .probability(opp.getProbability())
                .weightedAmount(opp.getWeightedAmount())
                .stageId(opp.getStage().getId().toString())
                .stageName(opp.getStage().getName())
                .stageColor(opp.getStage().getColor())
                .isClosed(opp.getIsClosed())
                .isWon(opp.getIsWon())
                .closeDate(opp.getCloseDate())
                .accountId(opp.getAccount().getId().toString())
                .accountName(opp.getAccount().getName())
                .primaryContactId(opp.getPrimaryContact() != null ? opp.getPrimaryContact().getId().toString() : null)
                .primaryContactName(opp.getPrimaryContact() != null ? opp.getPrimaryContact().getFullName() : null)
                .assignedToId(opp.getAssignedTo() != null ? opp.getAssignedTo().getId().toString() : null)
                .assignedToName(opp.getAssignedTo() != null ? opp.getAssignedTo().getFirstName() + " " + opp.getAssignedTo().getLastName() : null)
                .createdAt(opp.getCreatedAt())
                .stageChangedAt(opp.getStageChangedAt())
                .forecastCategory(opp.getForecastCategory())
                .nextFollowupDate(opp.getNextFollowupDate())
                .competitorName(opp.getCompetitorName())
                .build();
    }

    private OpportunityDto mapToDto(Opportunity opp) {
        OpportunityDto.OpportunityDtoBuilder builder = OpportunityDto.builder()
                .id(opp.getId().toString())
                .name(opp.getName())
                .amount(opp.getAmount())
                .currency(opp.getCurrency())
                .probability(opp.getProbability())
                .weightedAmount(opp.getWeightedAmount())
                .stage(mapToStageDto(opp.getStage()))
                .stageChangedAt(opp.getStageChangedAt())
                .closeDate(opp.getCloseDate())
                .actualCloseDate(opp.getActualCloseDate())
                .type(opp.getType())
                .leadSource(opp.getLeadSource())
                .leadId(opp.getLead() != null ? opp.getLead().getId().toString() : null)
                .campaignId(opp.getCampaignId() != null ? opp.getCampaignId().toString() : null)
                .isWon(opp.getIsWon())
                .isClosed(opp.getIsClosed())
                .closeReason(opp.getCloseReason())
                .competitorId(opp.getCompetitorId() != null ? opp.getCompetitorId().toString() : null)
                .description(opp.getDescription())
                .nextStep(opp.getNextStep())
                .tags(opp.getTags())
                .version(opp.getVersion())
                .createdAt(opp.getCreatedAt())
                .updatedAt(opp.getUpdatedAt());

        builder.account(OpportunityDto.AccountInfo.builder()
                .id(opp.getAccount().getId().toString())
                .name(opp.getAccount().getName())
                .accountType(opp.getAccount().getAccountType())
                .build());

        if (opp.getPrimaryContact() != null) {
            builder.primaryContact(OpportunityDto.ContactInfo.builder()
                    .id(opp.getPrimaryContact().getId().toString())
                    .fullName(opp.getPrimaryContact().getFullName())
                    .email(opp.getPrimaryContact().getEmail())
                    .phone(opp.getPrimaryContact().getPhoneMobile())
                    .build());
        }

        if (opp.getAssignedTo() != null) {
            builder.assignedTo(OpportunityDto.UserInfo.builder()
                    .id(opp.getAssignedTo().getId().toString())
                    .fullName(opp.getAssignedTo().getFirstName() + " " + opp.getAssignedTo().getLastName())
                    .email(opp.getAssignedTo().getEmail())
                    .build());
        }

        return builder.build();
    }
}
