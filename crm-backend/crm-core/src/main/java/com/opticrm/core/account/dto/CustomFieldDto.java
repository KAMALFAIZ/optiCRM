package com.opticrm.core.account.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomFieldDto {
    private UUID id;
    private String fieldName;
    private String fieldKey;
    private String fieldType;   // TEXT, NUMBER, DATE, SELECT, BOOLEAN
    private List<String> options; // For SELECT type
    private int sortOrder;
    private boolean required;
    private boolean active;
}
