package com.opticrm.workflow.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class WorkflowConfig {

    /**
     * RestTemplate used by WorkflowActionExecutor for WEBHOOK steps.
     * A dedicated bean avoids interfering with any RestTemplate defined in other modules.
     */
    @Bean("workflowRestTemplate")
    public RestTemplate workflowRestTemplate() {
        return new RestTemplate();
    }
}
