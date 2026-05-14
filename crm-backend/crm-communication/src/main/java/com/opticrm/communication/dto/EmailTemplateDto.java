package com.opticrm.communication.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailTemplateDto {

    private UUID id;
    private String name;
    private String subject;
    private String bodyHtml;
    private String bodyText;
    private String category;
    private String availableVariables;
    private Integer usageCount;
    private BigDecimal openRate;
    private BigDecimal clickRate;
    private Boolean isActive;
    private UserSummaryDto createdBy;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummaryDto {
        private UUID id;
        private String fullName;
    }
}
