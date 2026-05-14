package com.opticrm.core.googlecalendar.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "google.calendar")
public class GoogleCalendarProperties {
    private String clientId = "";
    private String clientSecret = "";
    private String redirectUri = "http://localhost:8081/api/v1/google-calendar/callback";
    private String frontendBaseUrl = "http://localhost:5173";
}
