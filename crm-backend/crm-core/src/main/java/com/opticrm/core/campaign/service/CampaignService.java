package com.opticrm.core.campaign.service;

import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.campaign.dto.*;
import com.opticrm.core.campaign.entity.Campaign;
import com.opticrm.core.campaign.repository.CampaignRepository;
import com.opticrm.core.lead.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final LeadRepository leadRepository;

    @Transactional(readOnly = true)
    public CampaignDto getById(UUID id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign", id));
        return toDto(campaign);
    }

    @Transactional(readOnly = true)
    public Page<CampaignListDto> list(int page, int size, String search, String status, String type) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Campaign> campaigns;
        if (search != null && !search.isBlank()) {
            campaigns = campaignRepository.search(search.trim(), pageRequest);
        } else if (status != null || type != null) {
            campaigns = campaignRepository.findWithFilters(status, type, pageRequest);
        } else {
            campaigns = campaignRepository.findAll(pageRequest);
        }

        return campaigns.map(this::toListDto);
    }

    @Transactional
    public CampaignDto create(CreateCampaignRequest request) {
        Campaign campaign = Campaign.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .status(request.getStatus() != null ? request.getStatus() : "draft")
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .budget(request.getBudget())
                .actualCost(request.getActualCost())
                .expectedRevenue(request.getExpectedRevenue())
                .build();

        campaign = campaignRepository.save(campaign);
        log.info("Created campaign: {}", campaign.getName());
        return toDto(campaign);
    }

    @Transactional
    public CampaignDto update(UUID id, UpdateCampaignRequest request) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign", id));

        if (request.getName() != null) campaign.setName(request.getName());
        if (request.getDescription() != null) campaign.setDescription(request.getDescription());
        if (request.getType() != null) campaign.setType(request.getType());
        if (request.getStatus() != null) campaign.setStatus(request.getStatus());
        if (request.getStartDate() != null) campaign.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) campaign.setEndDate(request.getEndDate());
        if (request.getBudget() != null) campaign.setBudget(request.getBudget());
        if (request.getActualCost() != null) campaign.setActualCost(request.getActualCost());
        if (request.getExpectedRevenue() != null) campaign.setExpectedRevenue(request.getExpectedRevenue());

        campaign = campaignRepository.save(campaign);
        log.info("Updated campaign: {}", id);
        return toDto(campaign);
    }

    @Transactional
    public void delete(UUID id) {
        if (!campaignRepository.existsById(id)) {
            throw new ResourceNotFoundException("Campaign", id);
        }
        campaignRepository.deleteById(id);
        log.info("Deleted campaign: {}", id);
    }

    private CampaignDto toDto(Campaign c) {
        long leads = leadRepository.countByCampaignId(c.getId());
        return CampaignDto.builder()
                .id(c.getId().toString())
                .name(c.getName())
                .description(c.getDescription())
                .type(c.getType())
                .status(c.getStatus())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .budget(c.getBudget())
                .actualCost(c.getActualCost())
                .expectedRevenue(c.getExpectedRevenue())
                .roi(c.getRoi())
                .createdByName(c.getCreatedBy() != null ? c.getCreatedBy().getFullName() : null)
                .leadsGenerated(leads)
                .opportunitiesGenerated(0) // TODO: count converted
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private CampaignListDto toListDto(Campaign c) {
        long leads = leadRepository.countByCampaignId(c.getId());
        return CampaignListDto.builder()
                .id(c.getId().toString())
                .name(c.getName())
                .type(c.getType())
                .status(c.getStatus())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .budget(c.getBudget())
                .actualCost(c.getActualCost())
                .expectedRevenue(c.getExpectedRevenue())
                .roi(c.getRoi())
                .leadsGenerated(leads)
                .build();
    }
}
