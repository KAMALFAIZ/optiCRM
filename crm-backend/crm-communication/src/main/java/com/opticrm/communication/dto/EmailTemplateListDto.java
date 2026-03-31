package com.opticrm.communication.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailTemplateListDto {

    private UUID id;
    private String name;
    private String subject;
    private String category;
    private Boolean isActive;
    private Integer usageCount;
    private BigDecimal openRate;
    private BigDecimal clickRate;
}
