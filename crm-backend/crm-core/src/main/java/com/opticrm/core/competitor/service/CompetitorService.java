package com.opticrm.core.competitor.service;

import com.opticrm.common.dto.PageRequest;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.competitor.dto.*;
import com.opticrm.core.competitor.entity.Competitor;
import com.opticrm.core.competitor.repository.CompetitorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompetitorService {

    private final CompetitorRepository competitorRepository;

    @Transactional(readOnly = true)
    public Page<CompetitorDto> list(PageRequest pageRequest, String search) {
        Page<Competitor> page = competitorRepository.search(search, pageRequest.toPageable());
        return page.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<CompetitorDto> listActive() {
        return competitorRepository.findByIsActiveTrue()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CompetitorDto getById(UUID id) {
        Competitor competitor = competitorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Concurrent", id.toString()));
        return toDto(competitor);
    }

    @Transactional
    public CompetitorDto create(CreateCompetitorRequest request) {
        Competitor competitor = Competitor.builder()
                .name(request.getName())
                .website(request.getWebsite())
                .description(request.getDescription())
                .strengths(request.getStrengths())
                .weaknesses(request.getWeaknesses())
                .build();
        return toDto(competitorRepository.save(competitor));
    }

    @Transactional
    public CompetitorDto update(UUID id, UpdateCompetitorRequest request) {
        Competitor competitor = competitorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Concurrent", id.toString()));

        if (request.getName() != null) competitor.setName(request.getName());
        if (request.getWebsite() != null) competitor.setWebsite(request.getWebsite());
        if (request.getDescription() != null) competitor.setDescription(request.getDescription());
        if (request.getStrengths() != null) competitor.setStrengths(request.getStrengths());
        if (request.getWeaknesses() != null) competitor.setWeaknesses(request.getWeaknesses());
        if (request.getIsActive() != null) competitor.setIsActive(request.getIsActive());

        return toDto(competitorRepository.save(competitor));
    }

    @Transactional
    public void delete(UUID id) {
        if (!competitorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Concurrent", id.toString());
        }
        competitorRepository.deleteById(id);
    }

    private CompetitorDto toDto(Competitor c) {
        return CompetitorDto.builder()
                .id(c.getId().toString())
                .name(c.getName())
                .website(c.getWebsite())
                .description(c.getDescription())
                .strengths(c.getStrengths())
                .weaknesses(c.getWeaknesses())
                .isActive(c.getIsActive())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
