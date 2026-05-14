package com.opticrm.core.googlecalendar.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GoogleCalendarStatusDto {
    private boolean connected;
    private String googleEmail;
    private String calendarId;
    private boolean syncEnabled;
}
