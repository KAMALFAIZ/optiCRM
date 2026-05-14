package com.opticrm.tenant.datasource;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

/**
 * Remplace l'auto-configuration DataSource de Spring Boot.
 *
 * Deux beans :
 *  - systemDataSource  : pool Hikari fixe sur la base principale (tables système)
 *  - dataSource (@Primary) : TenantRoutingDataSource dynamique
 */
@Configuration
public class DataSourceConfig {

    @Value("${spring.datasource.url}")
    private String url;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Bean(name = "systemDataSource")
    public DataSource systemDataSource() {
        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl(url);
        cfg.setUsername(username);
        cfg.setPassword(password);
        cfg.setMaximumPoolSize(10);
        cfg.setMinimumIdle(3);
        cfg.setConnectionTimeout(30_000);
        cfg.setIdleTimeout(600_000);
        cfg.setMaxLifetime(1_800_000);
        cfg.setConnectionInitSql("SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON");
        cfg.setPoolName("opticrm-system");
        return new HikariDataSource(cfg);
    }

    @Primary
    @Bean(name = "dataSource")
    @DependsOn({"systemDataSource", "tenantDataSourceManager"})
    public DataSource routingDataSource(DataSource systemDataSource,
                                        TenantDataSourceManager manager) {
        return new TenantRoutingDataSource(systemDataSource, manager);
    }
}
