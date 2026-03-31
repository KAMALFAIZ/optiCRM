package com.opticrm.core.account.service;

import com.opticrm.common.exception.DuplicateEntryException;
import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.account.dto.CreatePricingCategoryRequest;
import com.opticrm.core.account.dto.PricingCategoryDto;
import com.opticrm.core.account.entity.PricingCategory;
import com.opticrm.core.account.repository.PricingCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PricingCategoryService {

    private final PricingCategoryRepository pricingCategoryRepository;

    @Transactional(readOnly = true)
    public List<PricingCategoryDto> getAll() {
        return pricingCategoryRepository.findAllByOrderBySortOrderAscNameAsc()
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PricingCategoryDto> getActive() {
        return pricingCategoryRepository.findByIsActiveTrueOrderBySortOrderAscNameAsc()
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PricingCategoryDto getById(UUID id) {
        return mapToDto(pricingCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PricingCategory", id)));
    }

    @Transactional
    public PricingCategoryDto create(CreatePricingCategoryRequest request) {
        if (pricingCategoryRepository.existsByCode(request.getCode().toUpperCase())) {
            throw new DuplicateEntryException("code", request.getCode());
        }

        // If new category is set as default, unset all others
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            pricingCategoryRepository.findAllByOrderBySortOrderAscNameAsc()
                    .forEach(c -> { c.setIsDefault(false); pricingCategoryRepository.save(c); });
        }

        PricingCategory category = PricingCategory.builder()
                .code(request.getCode().toUpperCase())
                .name(request.getName())
                .description(request.getDescription())
                .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();

        category = pricingCategoryRepository.save(category);
        log.info("Created pricing category: {} ({})", category.getName(), category.getCode());
        return mapToDto(category);
    }

    @Transactional
    public PricingCategoryDto update(UUID id, CreatePricingCategoryRequest request) {
        PricingCategory category = pricingCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PricingCategory", id));

        if (request.getName() != null) category.setName(request.getName());
        if (request.getDescription() != null) category.setDescription(request.getDescription());
        if (request.getIsActive() != null) category.setIsActive(request.getIsActive());
        if (request.getSortOrder() != null) category.setSortOrder(request.getSortOrder());

        // Handle default flag
        if (Boolean.TRUE.equals(request.getIsDefault()) && !Boolean.TRUE.equals(category.getIsDefault())) {
            pricingCategoryRepository.findAllByOrderBySortOrderAscNameAsc()
                    .forEach(c -> { c.setIsDefault(false); pricingCategoryRepository.save(c); });
            category.setIsDefault(true);
        } else if (Boolean.FALSE.equals(request.getIsDefault())) {
            category.setIsDefault(false);
        }

        category = pricingCategoryRepository.save(category);
        log.info("Updated pricing category: {}", id);
        return mapToDto(category);
    }

    @Transactional
    public void delete(UUID id) {
        PricingCategory category = pricingCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PricingCategory", id));
        if (Boolean.TRUE.equals(category.getIsDefault())) {
            throw new com.opticrm.common.exception.BusinessException(
                    "PRICING_CATEGORY_DEFAULT", "Impossible de supprimer la catégorie tarifaire par défaut");
        }
        pricingCategoryRepository.deleteById(id);
        log.info("Deleted pricing category: {}", id);
    }

    public PricingCategoryDto mapToDto(PricingCategory category) {
        return PricingCategoryDto.builder()
                .id(category.getId().toString())
                .code(category.getCode())
                .name(category.getName())
                .description(category.getDescription())
                .isDefault(category.getIsDefault())
                .isActive(category.getIsActive())
                .sortOrder(category.getSortOrder())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
