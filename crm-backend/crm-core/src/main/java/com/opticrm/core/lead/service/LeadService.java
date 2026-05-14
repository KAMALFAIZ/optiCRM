package com.opticrm.core.lead.service;

import com.opticrm.common.dto.PageRequest;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.contact.entity.Contact;
import com.opticrm.core.contact.repository.ContactRepository;
import com.opticrm.core.lead.dto.*;
import com.opticrm.core.lead.entity.Lead;
import com.opticrm.core.lead.repository.LeadRepository;
import com.opticrm.core.opportunity.entity.Opportunity;
import com.opticrm.core.opportunity.entity.OpportunityStage;
import com.opticrm.core.opportunity.repository.OpportunityRepository;
import com.opticrm.core.opportunity.repository.OpportunityStageRepository;
import com.opticrm.security.config.ContextUtils;
import com.opticrm.security.entity.Territory;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.TerritoryRepository;
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
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final TerritoryRepository territoryRepository;
    private final AccountRepository accountRepository;
    private final ContactRepository contactRepository;
    private final OpportunityRepository opportunityRepository;
    private final OpportunityStageRepository opportunityStageRepository;

    @Transactional(readOnly = true)
    public Page<LeadListDto> list(PageRequest pageRequest, String search, String status, String source, String assignedToId) {
        // COMMERCIAL ne voit que ses propres pistes
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

        UUID assignedToUuid = assignedToId != null ? UUID.fromString(assignedToId) : null;

        return leadRepository.findAllWithFilters(search, status, source, assignedToUuid, pageable)
                .map(this::mapToListDto);
    }

    @Transactional(readOnly = true)
    public LeadDto getById(UUID id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));
        return mapToDto(lead);
    }

    @Transactional
    public LeadDto create(CreateLeadRequest request) {
        Lead lead = Lead.builder()
                .salutation(request.getSalutation())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .mobile(request.getMobile())
                .companyName(request.getCompanyName())
                .jobTitle(request.getJobTitle())
                .website(request.getWebsite())
                .street(request.getStreet())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .country(request.getCountry())
                .status(request.getStatus() != null ? request.getStatus() : "new")
                .source(request.getSource())
                .sourceDetails(request.getSourceDetails())
                .rating(request.getRating())
                .leadScore(request.getLeadScore() != null ? request.getLeadScore() : 0)
                .interestedProducts(request.getInterestedProducts())
                .budgetRange(request.getBudgetRange())
                .decisionTimeframe(request.getDecisionTimeframe())
                .fax(request.getFax())
                .linkedinUrl(request.getLinkedinUrl())
                .industry(request.getIndustry())
                .numEmployees(request.getNumEmployees())
                .annualRevenue(request.getAnnualRevenue())
                .priority(request.getPriority())
                .doNotCall(request.getDoNotCall() != null ? request.getDoNotCall() : false)
                .doNotEmail(request.getDoNotEmail() != null ? request.getDoNotEmail() : false)
                .nextFollowUpDate(request.getNextFollowUpDate())
                .description(request.getDescription())
                .qualificationNotes(request.getQualificationNotes())
                .competitor(request.getCompetitor())
                .productDemoRequested(request.getProductDemoRequested() != null ? request.getProductDemoRequested() : false)
                .meetingScheduledAt(request.getMeetingScheduledAt())
                .build();

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(UUID.fromString(request.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            lead.setAssignedTo(assignedTo);
        } else if (ContextUtils.hasRole("COMMERCIAL")) {
            // Auto-assigner la piste au commercial qui la crée
            UUID currentUserId = ContextUtils.getCurrentUserId().orElse(null);
            if (currentUserId != null) {
                User currentUser = userRepository.findById(currentUserId).orElse(null);
                if (currentUser != null) {
                    lead.setAssignedTo(currentUser);
                    log.info("Auto-assigned lead '{}' to commercial '{}'", lead.getFullName(), currentUser.getEmail());
                }
            }
        }

        if (request.getTerritoryId() != null) {
            Territory territory = territoryRepository.findById(UUID.fromString(request.getTerritoryId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Territory not found"));
            lead.setTerritory(territory);
        }

        if (request.getCampaignId() != null) {
            lead.setCampaignId(UUID.fromString(request.getCampaignId()));
        }

        lead = leadRepository.save(lead);
        log.info("Created lead: {} - {}", lead.getId(), lead.getFullName());

        return mapToDto(lead);
    }

    @Transactional
    public LeadDto update(UUID id, UpdateLeadRequest request) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));

        // Optimistic locking
        if (request.getVersion() != null) {
            lead.setVersion(request.getVersion());
        }

        if (request.getSalutation() != null) lead.setSalutation(request.getSalutation());
        if (request.getFirstName() != null) lead.setFirstName(request.getFirstName());
        if (request.getLastName() != null) lead.setLastName(request.getLastName());
        if (request.getEmail() != null) lead.setEmail(request.getEmail());
        if (request.getPhone() != null) lead.setPhone(request.getPhone());
        if (request.getMobile() != null) lead.setMobile(request.getMobile());
        if (request.getCompanyName() != null) lead.setCompanyName(request.getCompanyName());
        if (request.getJobTitle() != null) lead.setJobTitle(request.getJobTitle());
        if (request.getWebsite() != null) lead.setWebsite(request.getWebsite());
        if (request.getStreet() != null) lead.setStreet(request.getStreet());
        if (request.getCity() != null) lead.setCity(request.getCity());
        if (request.getState() != null) lead.setState(request.getState());
        if (request.getPostalCode() != null) lead.setPostalCode(request.getPostalCode());
        if (request.getCountry() != null) lead.setCountry(request.getCountry());
        if (request.getStatus() != null) lead.setStatus(request.getStatus());
        if (request.getSource() != null) lead.setSource(request.getSource());
        if (request.getSourceDetails() != null) lead.setSourceDetails(request.getSourceDetails());
        if (request.getRating() != null) lead.setRating(request.getRating());
        if (request.getLeadScore() != null) lead.setLeadScore(request.getLeadScore());
        if (request.getInterestedProducts() != null) lead.setInterestedProducts(request.getInterestedProducts());
        if (request.getBudgetRange() != null) lead.setBudgetRange(request.getBudgetRange());
        if (request.getDecisionTimeframe() != null) lead.setDecisionTimeframe(request.getDecisionTimeframe());
        if (request.getFax() != null) lead.setFax(request.getFax());
        if (request.getLinkedinUrl() != null) lead.setLinkedinUrl(request.getLinkedinUrl());
        if (request.getIndustry() != null) lead.setIndustry(request.getIndustry());
        if (request.getNumEmployees() != null) lead.setNumEmployees(request.getNumEmployees());
        if (request.getAnnualRevenue() != null) lead.setAnnualRevenue(request.getAnnualRevenue());
        if (request.getPriority() != null) lead.setPriority(request.getPriority());
        if (request.getDoNotCall() != null) lead.setDoNotCall(request.getDoNotCall());
        if (request.getDoNotEmail() != null) lead.setDoNotEmail(request.getDoNotEmail());
        if (request.getNextFollowUpDate() != null) lead.setNextFollowUpDate(request.getNextFollowUpDate());
        if (request.getDescription() != null) lead.setDescription(request.getDescription());
        if (request.getQualificationNotes() != null) lead.setQualificationNotes(request.getQualificationNotes());
        if (request.getCompetitor() != null) lead.setCompetitor(request.getCompetitor());
        if (request.getProductDemoRequested() != null) lead.setProductDemoRequested(request.getProductDemoRequested());
        if (request.getMeetingScheduledAt() != null) lead.setMeetingScheduledAt(request.getMeetingScheduledAt());

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(UUID.fromString(request.getAssignedToId()))
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            lead.setAssignedTo(assignedTo);
        }

        if (request.getTerritoryId() != null) {
            Territory territory = territoryRepository.findById(UUID.fromString(request.getTerritoryId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Territory not found"));
            lead.setTerritory(territory);
        }

        if (request.getCampaignId() != null) {
            lead.setCampaignId(UUID.fromString(request.getCampaignId()));
        }

        lead.setLastActivityAt(Instant.now());
        lead = leadRepository.save(lead);
        log.info("Updated lead: {}", lead.getId());

        return mapToDto(lead);
    }

    @Transactional
    public void delete(UUID id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));

        if (lead.getIsConverted()) {
            throw new IllegalStateException("Cannot delete a converted lead");
        }

        leadRepository.delete(lead);
        log.info("Deleted lead: {}", id);
    }

    @Transactional(readOnly = true)
    public List<LeadDto> findDuplicates(String firstName, String lastName, String email, String phone) {
        return leadRepository.findDuplicates(firstName, lastName, email, phone)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public ConvertLeadResponse convert(UUID id, ConvertLeadRequest request) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));

        if (Boolean.TRUE.equals(lead.getIsConverted())) {
            throw new IllegalStateException("Lead is already converted");
        }

        Account account = null;
        Contact contact = null;
        Opportunity opportunity = null;

        // Step 1: Resolve or create account
        if (request.getExistingAccountId() != null) {
            account = accountRepository.findById(UUID.fromString(request.getExistingAccountId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        } else if (Boolean.TRUE.equals(request.getCreateAccount())) {
            String accountName = request.getAccountName() != null && !request.getAccountName().isBlank()
                    ? request.getAccountName()
                    : lead.getCompanyName();
            if (accountName == null || accountName.isBlank()) {
                accountName = lead.getFullName();
            }
            account = Account.builder()
                    .name(accountName)
                    .accountType(request.getAccountType() != null ? request.getAccountType() : "prospect")
                    .phone(lead.getPhone())
                    .website(lead.getWebsite())
                    .billingStreet(lead.getStreet())
                    .billingCity(lead.getCity())
                    .billingState(lead.getState())
                    .billingPostalCode(lead.getPostalCode())
                    .billingCountry(lead.getCountry())
                    .build();
            account = accountRepository.save(account);
            log.info("Created account from lead {}: {}", id, account.getId());
        }

        // Step 2: Create contact
        if (Boolean.TRUE.equals(request.getCreateContact())) {
            String firstName = lead.getFirstName() != null && !lead.getFirstName().isBlank()
                    ? lead.getFirstName() : lead.getLastName();
            String lastName = lead.getFirstName() != null && !lead.getFirstName().isBlank()
                    ? lead.getLastName() : lead.getLastName();
            Contact.ContactBuilder contactBuilder = Contact.builder()
                    .salutation(lead.getSalutation())
                    .firstName(firstName)
                    .lastName(lastName)
                    .email(lead.getEmail())
                    .phoneMobile(lead.getMobile())
                    .phoneOffice(lead.getPhone())
                    .jobTitle(lead.getJobTitle())
                    .linkedinUrl(lead.getLinkedinUrl())
                    .addressStreet(lead.getStreet())
                    .addressCity(lead.getCity())
                    .addressState(lead.getState())
                    .addressPostalCode(lead.getPostalCode())
                    .addressCountry(lead.getCountry())
                    .doNotCall(lead.getDoNotCall())
                    .doNotEmail(lead.getDoNotEmail());
            if (account != null) {
                contactBuilder.account(account);
            }
            contact = contactRepository.save(contactBuilder.build());
            log.info("Created contact from lead {}: {}", id, contact.getId());
        }

        // Step 3: Create opportunity
        if (Boolean.TRUE.equals(request.getCreateOpportunity()) && account != null) {
            String oppName = request.getOpportunityName() != null && !request.getOpportunityName().isBlank()
                    ? request.getOpportunityName()
                    : "Opportunité - " + lead.getFullName();

            OpportunityStage stage;
            if (request.getOpportunityStageId() != null) {
                stage = opportunityStageRepository.findById(UUID.fromString(request.getOpportunityStageId()))
                        .orElseThrow(() -> new ResourceNotFoundException("Stage not found"));
            } else {
                stage = opportunityStageRepository.findOpenStages().stream().findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("No open stage found"));
            }

            LocalDate closeDate = request.getCloseDate() != null
                    ? LocalDate.parse(request.getCloseDate())
                    : LocalDate.now().plusMonths(3);

            Opportunity.OpportunityBuilder oppBuilder = Opportunity.builder()
                    .name(oppName)
                    .account(account)
                    .stage(stage)
                    .closeDate(closeDate)
                    .leadSource(lead.getSource());

            if (request.getOpportunityAmount() != null) {
                oppBuilder.amount(BigDecimal.valueOf(request.getOpportunityAmount()));
            }
            if (contact != null) {
                oppBuilder.primaryContact(contact);
            }

            opportunity = opportunityRepository.save(oppBuilder.build());
            log.info("Created opportunity from lead {}: {}", id, opportunity.getId());
        }

        // Step 4: Mark lead as converted
        lead.setIsConverted(true);
        lead.setConvertedAt(Instant.now());
        lead.setStatus("converted");
        if (contact != null) lead.setConvertedContact(contact);
        if (account != null) lead.setConvertedAccount(account);
        if (opportunity != null) lead.setConvertedOpportunityId(opportunity.getId());
        leadRepository.save(lead);
        log.info("Lead {} converted successfully", id);

        return ConvertLeadResponse.builder()
                .accountId(account != null ? account.getId().toString() : null)
                .contactId(contact != null ? contact.getId().toString() : null)
                .opportunityId(opportunity != null ? opportunity.getId().toString() : null)
                .build();
    }

    private LeadListDto mapToListDto(Lead lead) {
        return LeadListDto.builder()
                .id(lead.getId().toString())
                .firstName(lead.getFirstName())
                .lastName(lead.getLastName())
                .fullName(lead.getFullName())
                .email(lead.getEmail())
                .phone(lead.getPhone())
                .companyName(lead.getCompanyName())
                .jobTitle(lead.getJobTitle())
                .city(lead.getCity())
                .country(lead.getCountry())
                .status(lead.getStatus())
                .source(lead.getSource())
                .rating(lead.getRating())
                .leadScore(lead.getLeadScore())
                .assignedToId(lead.getAssignedTo() != null ? lead.getAssignedTo().getId().toString() : null)
                .assignedToName(lead.getAssignedTo() != null ? lead.getAssignedTo().getFirstName() + " " + lead.getAssignedTo().getLastName() : null)
                .createdAt(lead.getCreatedAt())
                .lastActivityAt(lead.getLastActivityAt())
                .build();
    }

    private LeadDto mapToDto(Lead lead) {
        LeadDto.LeadDtoBuilder builder = LeadDto.builder()
                .id(lead.getId().toString())
                .salutation(lead.getSalutation())
                .firstName(lead.getFirstName())
                .lastName(lead.getLastName())
                .fullName(lead.getFullName())
                .email(lead.getEmail())
                .phone(lead.getPhone())
                .mobile(lead.getMobile())
                .companyName(lead.getCompanyName())
                .jobTitle(lead.getJobTitle())
                .website(lead.getWebsite())
                .street(lead.getStreet())
                .city(lead.getCity())
                .state(lead.getState())
                .postalCode(lead.getPostalCode())
                .country(lead.getCountry())
                .fullAddress(lead.getFullAddress())
                .status(lead.getStatus())
                .source(lead.getSource())
                .sourceDetails(lead.getSourceDetails())
                .rating(lead.getRating())
                .leadScore(lead.getLeadScore())
                .interestedProducts(lead.getInterestedProducts())
                .budgetRange(lead.getBudgetRange())
                .decisionTimeframe(lead.getDecisionTimeframe())
                .fax(lead.getFax())
                .linkedinUrl(lead.getLinkedinUrl())
                .industry(lead.getIndustry())
                .numEmployees(lead.getNumEmployees())
                .annualRevenue(lead.getAnnualRevenue())
                .priority(lead.getPriority())
                .doNotCall(lead.getDoNotCall())
                .doNotEmail(lead.getDoNotEmail())
                .nextFollowUpDate(lead.getNextFollowUpDate())
                .description(lead.getDescription())
                .qualificationNotes(lead.getQualificationNotes())
                .competitor(lead.getCompetitor())
                .productDemoRequested(lead.getProductDemoRequested())
                .meetingScheduledAt(lead.getMeetingScheduledAt())
                .campaignId(lead.getCampaignId() != null ? lead.getCampaignId().toString() : null)
                .isConverted(lead.getIsConverted())
                .convertedAt(lead.getConvertedAt())
                .convertedContactId(lead.getConvertedContact() != null ? lead.getConvertedContact().getId().toString() : null)
                .convertedAccountId(lead.getConvertedAccount() != null ? lead.getConvertedAccount().getId().toString() : null)
                .convertedOpportunityId(lead.getConvertedOpportunityId() != null ? lead.getConvertedOpportunityId().toString() : null)
                .version(lead.getVersion())
                .createdAt(lead.getCreatedAt())
                .updatedAt(lead.getUpdatedAt())
                .lastActivityAt(lead.getLastActivityAt());

        if (lead.getAssignedTo() != null) {
            builder.assignedTo(LeadDto.UserInfo.builder()
                    .id(lead.getAssignedTo().getId().toString())
                    .fullName(lead.getAssignedTo().getFirstName() + " " + lead.getAssignedTo().getLastName())
                    .email(lead.getAssignedTo().getEmail())
                    .build());
        }

        if (lead.getTerritory() != null) {
            builder.territory(LeadDto.TerritoryInfo.builder()
                    .id(lead.getTerritory().getId().toString())
                    .name(lead.getTerritory().getName())
                    .region(lead.getTerritory().getRegion())
                    .build());
        }

        return builder.build();
    }
}
