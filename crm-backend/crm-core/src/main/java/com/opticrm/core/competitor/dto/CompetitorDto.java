package com.opticrm.core.competitor.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CompetitorDto {
    private String id;
    private String name;
    private String website;
    private String description;
    private String strengths;
    private String weaknesses;
    private Boolean isActive;
    private Instant createdAt;
}
