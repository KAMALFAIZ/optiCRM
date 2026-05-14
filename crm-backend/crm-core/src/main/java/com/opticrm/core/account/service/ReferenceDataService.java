package com.opticrm.core.account.service;

import com.opticrm.common.exception.BusinessException;
import com.opticrm.core.account.dto.ReferenceDataDto;
import com.opticrm.core.account.entity.ReferenceData;
import com.opticrm.core.account.repository.ReferenceDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReferenceDataService {

    private final ReferenceDataRepository repository;

    @Transactional(readOnly = true)
    public List<ReferenceDataDto> getByCategory(String category) {
        return repository.findByCategoryOrderBySortOrder(category).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReferenceDataDto> getActiveByCategory(String category) {
        return repository.findByCategoryAndActiveOrderBySortOrder(category, true).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, List<ReferenceDataDto>> getAll() {
        return repository.findAllByOrderByCategoryAscSortOrderAsc().stream()
                .map(this::toDto)
                .collect(Collectors.groupingBy(ReferenceDataDto::getCategory));
    }

    @Transactional
    public ReferenceDataDto create(ReferenceDataDto dto) {
        if (repository.existsByCategoryAndValue(dto.getCategory(), dto.getValue())) {
            throw new BusinessException("DUPLICATE_VALUE",
                    "La valeur '" + dto.getValue() + "' existe déjà dans la catégorie '" + dto.getCategory() + "'.");
        }
        ReferenceData entity = new ReferenceData();
        entity.setCategory(dto.getCategory());
        entity.setValue(dto.getValue());
        entity.setLabel(dto.getLabel());
        entity.setColor(dto.getColor());
        entity.setSortOrder(dto.getSortOrder());
        entity.setActive(dto.isActive());
        return toDto(repository.save(entity));
    }

    @Transactional
    public ReferenceDataDto update(UUID id, ReferenceDataDto dto) {
        ReferenceData entity = repository.findById(id)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Donnée de référence introuvable."));
        entity.setValue(dto.getValue());
        entity.setLabel(dto.getLabel());
        entity.setColor(dto.getColor());
        entity.setSortOrder(dto.getSortOrder());
        entity.setActive(dto.isActive());
        return toDto(repository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new BusinessException("NOT_FOUND", "Donnée de référence introuvable.");
        }
        repository.deleteById(id);
    }

    private ReferenceDataDto toDto(ReferenceData entity) {
        return ReferenceDataDto.builder()
                .id(entity.getId())
                .category(entity.getCategory())
                .value(entity.getValue())
                .label(entity.getLabel())
                .color(entity.getColor())
                .sortOrder(entity.getSortOrder())
                .active(entity.isActive())
                .build();
    }
}
