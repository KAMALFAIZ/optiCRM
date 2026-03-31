package com.opticrm.core.lead.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class LeadListDto {
    private String id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private String companyName;
    private String jobTitle;
    private String city;
    private String country;
    private String status;
    private String source;
    private String rating;
    private Integer leadScore;
    private String assignedToId;
    private String assignedToName;
    private Instant createdAt;
    private Instant lastActivityAt;
}
