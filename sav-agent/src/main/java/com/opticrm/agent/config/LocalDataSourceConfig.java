package com.opticrm.agent.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * Configuration du DataSource local.
 * Activée uniquement si sav-agent.local-database.enabled=true et url est renseignée.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "sav-agent.local-database", name = "enabled", havingValue = "true")
public class LocalDataSourceConfig {

    private final AgentProperties properties;

    @Bean
    public DataSource dataSource() {
        AgentProperties.LocalDatabase db = properties.getLocalDatabase();

        log.info("Configuring local DataSource: {}", db.getUrl());

        return DataSourceBuilder.create()
                .url(db.getUrl())
                .username(db.getUsername())
                .password(db.getPassword())
                .build();
    }
}
