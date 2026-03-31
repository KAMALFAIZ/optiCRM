package com.opticrm.core.objection.dto;

import com.opticrm.core.objection.entity.Objection;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ObjectionDto {

    private UUID id;
    private String code;
    private String title;
    private String description;
    private Objection.ObjectionCategory category;
    private String response;
    private RelatedEntityDto contact;
    private RelatedEntityDto account;
    private RelatedEntityDto opportunity;
    private Objection.ObjectionStatus status;
    private Objection.ObjectionPriority priority;
    private Objection.ObjectionSource source;
    private UserSummaryDto createdBy;
    private UserSummaryDto assignedTo;
    private Instant resolvedAt;
    private UserSummaryDto resolvedBy;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RelatedEntityDto {
        private UUID id;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummaryDto {
        private UUID id;
        private String fullName;
    }
}
