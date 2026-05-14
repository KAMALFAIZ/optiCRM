package com.opticrm.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepTrendDto {

    private UUID userId;
    private String repName;
    private List<MonthlyTrendDto> months;
}
