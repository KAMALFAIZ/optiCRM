package com.opticrm.core.account.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opticrm.common.exception.BusinessException;
import com.opticrm.core.account.dto.CustomFieldDto;
import com.opticrm.core.account.dto.CustomFieldValueDto;
import com.opticrm.core.account.entity.CustomField;
import com.opticrm.core.account.entity.CustomFieldValue;
import com.opticrm.core.account.repository.CustomFieldRepository;
import com.opticrm.core.account.repository.CustomFieldValueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomFieldService {

    private final CustomFieldRepository fieldRepo;
    private final CustomFieldValueRepository valueRepo;
    private final ObjectMapper objectMapper;

    // ───── Field definitions (admin) ────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CustomFieldDto> getAllFields() {
        return fieldRepo.findAllByOrderBySortOrderAsc().stream()
                .map(this::toFieldDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CustomFieldDto> getActiveFields() {
        return fieldRepo.findByActiveOrderBySortOrderAsc(true).stream()
                .map(this::toFieldDto)
                .toList();
    }

    @Transactional
    public CustomFieldDto createField(CustomFieldDto dto) {
        if (fieldRepo.existsByFieldKey(dto.getFieldKey())) {
            throw new BusinessException("DUPLICATE_KEY",
                    "La clé '" + dto.getFieldKey() + "' existe déjà.");
        }
        CustomField entity = new CustomField();
        entity.setFieldName(dto.getFieldName());
        entity.setFieldKey(dto.getFieldKey());
        entity.setFieldType(dto.getFieldType());
        entity.setFieldOptions(toJson(dto.getOptions()));
        entity.setSortOrder(dto.getSortOrder());
        entity.setRequired(dto.isRequired());
        entity.setActive(dto.isActive());
        return toFieldDto(fieldRepo.save(entity));
    }

    @Transactional
    public CustomFieldDto updateField(UUID id, CustomFieldDto dto) {
        CustomField entity = fieldRepo.findById(id)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Champ introuvable."));
        entity.setFieldName(dto.getFieldName());
        entity.setFieldType(dto.getFieldType());
        entity.setFieldOptions(toJson(dto.getOptions()));
        entity.setSortOrder(dto.getSortOrder());
        entity.setRequired(dto.isRequired());
        entity.setActive(dto.isActive());
        return toFieldDto(fieldRepo.save(entity));
    }

    @Transactional
    public void deleteField(UUID id) {
        if (!fieldRepo.existsById(id)) {
            throw new BusinessException("NOT_FOUND", "Champ introuvable.");
        }
        fieldRepo.deleteById(id);
    }

    // ───── Field values (per account) ───────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CustomFieldValueDto> getValuesForAccount(UUID accountId) {
        List<CustomField> activeFields = fieldRepo.findByActiveOrderBySortOrderAsc(true);
        List<CustomFieldValue> values = valueRepo.findByAccountId(accountId);

        Map<UUID, CustomFieldValue> valueMap = values.stream()
                .collect(Collectors.toMap(CustomFieldValue::getFieldId, Function.identity(), (a, b) -> a));

        return activeFields.stream().map(field -> {
            CustomFieldValue val = valueMap.get(field.getId());
            return CustomFieldValueDto.builder()
                    .id(val != null ? val.getId() : null)
                    .fieldId(field.getId())
                    .fieldKey(field.getFieldKey())
                    .fieldName(field.getFieldName())
                    .fieldType(field.getFieldType())
                    .value(val != null ? val.getFieldValue() : null)
                    .build();
        }).toList();
    }

    @Transactional
    public List<CustomFieldValueDto> saveValuesForAccount(UUID accountId, Map<UUID, String> fieldValues) {
        for (var entry : fieldValues.entrySet()) {
            UUID fieldId = entry.getKey();
            String value = entry.getValue();

            Optional<CustomFieldValue> existing = valueRepo.findByAccountIdAndFieldId(accountId, fieldId);
            if (existing.isPresent()) {
                CustomFieldValue cfv = existing.get();
                cfv.setFieldValue(value);
                valueRepo.save(cfv);
            } else if (value != null && !value.isBlank()) {
                CustomFieldValue cfv = new CustomFieldValue();
                cfv.setAccountId(accountId);
                cfv.setFieldId(fieldId);
                cfv.setFieldValue(value);
                valueRepo.save(cfv);
            }
        }
        return getValuesForAccount(accountId);
    }

    // ───── Helpers ──────────────────────────────────────────────────────────

    private CustomFieldDto toFieldDto(CustomField entity) {
        return CustomFieldDto.builder()
                .id(entity.getId())
                .fieldName(entity.getFieldName())
                .fieldKey(entity.getFieldKey())
                .fieldType(entity.getFieldType())
                .options(fromJson(entity.getFieldOptions()))
                .sortOrder(entity.getSortOrder())
                .required(entity.isRequired())
                .active(entity.isActive())
                .build();
    }

    private String toJson(List<String> list) {
        if (list == null || list.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private List<String> fromJson(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }
}
