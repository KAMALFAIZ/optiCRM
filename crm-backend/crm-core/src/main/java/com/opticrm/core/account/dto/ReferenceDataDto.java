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
public class ReferenceDataDto {
    private UUID id;
    private String category;
    private String value;
    private String label;
    private String color;
    private int sortOrder;
    private boolean active;
}
