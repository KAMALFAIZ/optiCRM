package com.opticrm.api.integration.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldMappingDto {
    private UUID id;
    private String champSource;
    private String champOpticrm;
    private boolean actif;
}
