package com.opticrm.api.integration.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class SaveMappingsRequest {
    private List<MappingItem> mappings;

    @Data
    public static class MappingItem {
        @NotBlank
        private String champSource;
        @NotBlank
        private String champOpticrm;
        private boolean actif = true;
    }
}
