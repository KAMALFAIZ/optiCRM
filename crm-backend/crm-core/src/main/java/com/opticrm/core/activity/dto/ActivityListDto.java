package com.opticrm.core.activity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityListDto {

    private String id;
    private String activityType;
    private String subject;
    private Instant startDate;
    private Instant endDate;
    private Instant dueDate;
    private String status;
    private String priority;
    private String location;
    private String assignedToName;
    private String relatedToType;
    private String relatedToId;
    private Instant createdAt;
}
