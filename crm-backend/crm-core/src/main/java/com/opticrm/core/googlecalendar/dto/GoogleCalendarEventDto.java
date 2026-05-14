package com.opticrm.core.googlecalendar.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GoogleCalendarEventDto {
    private String id;
    private String title;
    private String start;
    private String end;
    private String description;
    private String location;
    private String htmlLink;
    private String source = "google";
}
