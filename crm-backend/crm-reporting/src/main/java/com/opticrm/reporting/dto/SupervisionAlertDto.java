package com.opticrm.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupervisionAlertDto {

    public enum Severity { CRITICAL, WARNING, INFO }

    private UUID userId;
    private String repName;
    private Severity severity;
    private String code;
    private String message;
    private double value;
    private double threshold;
}
