package com.opticrm.core.objection.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ObjectionStatsDto {

    private long totalObjections;
    private long openObjections;
    private long inProgressObjections;
    private long resolvedObjections;
    private long escalatedObjections;
    private Map<String, Long> byCategory;
    private Map<String, Long> byStatus;
}
