package com.opticrm.api.agent.dto;

import java.util.UUID;

public record PendingExportDto(
        UUID exportId,
        String entityType,
        UUID entityId,
        Integer sageDocType,
        String action,
        String payload,        // JSON brut à écrire dans Sage
        int retryCount
) {}
