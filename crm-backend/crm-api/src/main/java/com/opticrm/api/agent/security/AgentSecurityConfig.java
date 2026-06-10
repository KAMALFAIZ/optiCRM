package com.opticrm.api.agent.security;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Chaîne de sécurité dédiée aux endpoints utilisés par l'agent local.
 * Précède la chaîne principale grâce à @Order(1).
 */
@Configuration
@RequiredArgsConstructor
public class AgentSecurityConfig {

    private final AgentAuthenticationFilter agentAuthenticationFilter;

    @Bean
    @Order(1)
    public SecurityFilterChain agentSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/v1/agent/**", "/api/v1/sage/push")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(c -> {})
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // L'agent peut s'enregistrer sans clé (premier appel),
                        // mais le tenant doit déjà avoir généré une clé côté UI.
                        // Donc toutes les routes nécessitent ROLE_AGENT.
                        .anyRequest().hasRole("AGENT")
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> {
                            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write(
                                "{\"success\":false,\"error\":{\"code\":\"AGENT_UNAUTHORIZED\",\"message\":\"Clé d'agent manquante ou invalide\"}}");
                        })
                        .accessDeniedHandler((req, res, e) -> {
                            res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write(
                                "{\"success\":false,\"error\":{\"code\":\"AGENT_FORBIDDEN\",\"message\":\"Accès agent refusé\"}}");
                        })
                )
                .addFilterBefore(agentAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
