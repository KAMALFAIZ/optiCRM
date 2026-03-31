package com.opticrm.core.competitor.dto;

import lombok.Data;

@Data
public class UpdateCompetitorRequest {
    private String name;
    private String website;
    private String description;
    private String strengths;
    private String weaknesses;
    private Boolean isActive;
}
