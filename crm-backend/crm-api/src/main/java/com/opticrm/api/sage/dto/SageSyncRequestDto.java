package com.opticrm.api.sage.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data @Builder
public class SageSyncRequestDto {
    private UUID id;
    private String entityType;
    private String label;
    private String sourceFormat;
    private String status;
    private int totalItems;
    private int processedItems;
    private int successItems;
    private int errorItems;
    private int skipItems;
    private Integer periodYear;
    private Integer periodMonth;
    private String createdByName;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;

    // Items (only when fetching detail)
    private List<SageSyncItemDto> items;

    @Data @Builder
    public static class SageSyncItemDto {
        private UUID id;
        private int rowIndex;
        private String sageRef;
        private UUID crmId;
        private String crmName;
        private String action;   // CREATE | UPDATE | SKIP | ERROR
        private String status;
        private Map<String, Object> rawData;
        private Map<String, Object> mappedData;
        private Map<String, Object> diffData;
        private String errorMessage;
    }
}
