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
public class ObjectionListDto {

    private UUID id;
    private String code;
    private String title;
    private Objection.ObjectionCategory category;
    private Objection.ObjectionStatus status;
    private Objection.ObjectionPriority priority;
    private Objection.ObjectionSource source;
    private String accountName;
    private UUID accountId;
    private String contactName;
    private UUID contactId;
    private String assignedToName;
    private UUID assignedToId;
    private Instant createdAt;
    private Instant resolvedAt;
}
