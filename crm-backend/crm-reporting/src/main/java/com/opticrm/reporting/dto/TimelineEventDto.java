package com.opticrm.reporting.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TimelineEventDto {

    private String id;
    private String type;
    private String title;
    private String description;
    private String date;
    private String status;
    private BigDecimal amount;
    private String userId;
    private String userName;
    private Map<String, Object> metadata;
}
