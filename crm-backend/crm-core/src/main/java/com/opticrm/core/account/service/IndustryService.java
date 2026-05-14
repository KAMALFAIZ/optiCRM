package com.opticrm.core.account.service;

import com.opticrm.core.account.entity.Industry;
import com.opticrm.core.account.repository.IndustryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IndustryService {

    private final IndustryRepository industryRepository;

    @Transactional(readOnly = true)
    public List<IndustryDto> getAll() {
        return industryRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IndustryDto> getRootIndustries() {
        return industryRepository.findByParentIndustryIsNull()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private IndustryDto mapToDto(Industry industry) {
        return IndustryDto.builder()
                .id(industry.getId().toString())
                .code(industry.getCode())
                .name(industry.getName())
                .parentId(industry.getParentIndustry() != null
                        ? industry.getParentIndustry().getId().toString()
                        : null)
                .build();
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class IndustryDto {
        private String id;
        private String code;
        private String name;
        private String parentId;
    }
}
