package com.opticrm.core.googlecalendar.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
@EnableConfigurationProperties(GoogleCalendarProperties.class)
public class GoogleCalendarConfig {

    @Bean("googleCalendarRestTemplate")
    public RestTemplate googleCalendarRestTemplate() {
        return new RestTemplate();
    }
}
