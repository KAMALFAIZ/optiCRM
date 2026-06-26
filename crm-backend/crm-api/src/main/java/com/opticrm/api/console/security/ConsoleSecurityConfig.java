package com.opticrm.api.console.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Chaîne de sécurité dédiée aux endpoints de la console KASOFT (monitoring du parc).
 * Précède la chaîne principale grâce à @Order(2) et laisse passer /api/console/**
 * sans JWT ; l'authentification se fait par le header X-Console-Token vérifié dans
 * le contrôleur (token de service configuré côté instance).
 */
@Configuration
public class ConsoleSecurityConfig {

    @Bean
    @Order(2)
    public SecurityFilterChain consoleSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/console/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(c -> {})
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
