package com.opticrm.core.account.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomFieldValueDto {
    private UUID id;
    private UUID fieldId;
    private String fieldKey;
    private String fieldName;
    private String fieldType;
    private String value;
}
