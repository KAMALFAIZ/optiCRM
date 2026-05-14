package com.opticrm.core.visit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitListDto {

    private String id;
    private String visitType;
    private String subject;
    private Instant visitDate;
    private Integer duration;
    private String status;
    private String address;
    private String city;
    private String outcome;
    private String contactName;
    private String accountName;
    private String assignedToName;
    private Instant checkInAt;
    private Instant checkOutAt;
    private Instant createdAt;
}
