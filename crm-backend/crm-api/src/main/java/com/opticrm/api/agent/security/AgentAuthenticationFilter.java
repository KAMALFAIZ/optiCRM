package com.opticrm.api.agent.security;

import com.opticrm.api.agent.entity.AgentApiKey;
import com.opticrm.api.agent.repository.AgentApiKeyRepository;
import com.opticrm.tenant.context.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

/**
 * Filter d'authentification pour l'agent local de synchronisation Sage.
 * Lit le header X-Agent-Key, hash SHA-256, lookup dans agent_api_keys.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AgentAuthenticationFilter extends OncePerRequestFilter {

    public static final String AGENT_HEADER = "X-Agent-Key";
    public static final String ROLE_AGENT   = "ROLE_AGENT";

    private final AgentApiKeyRepository agentApiKeyRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String rawKey = request.getHeader(AGENT_HEADER);
        if (!StringUtils.hasText(rawKey)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String hash = sha256(rawKey);
            Optional<AgentApiKey> opt =
                    agentApiKeyRepository.findByKeyHashAndEnabledTrueAndRevokedAtIsNull(hash);

            if (opt.isPresent()) {
                AgentApiKey key = opt.get();
                TenantContext.set(key.getTenantId());

                AgentPrincipal principal = new AgentPrincipal(
                        key.getId(), key.getTenantId(), key.getLabel());

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                principal, null,
                                List.of(new SimpleGrantedAuthority(ROLE_AGENT)));

                SecurityContextHolder.getContext().setAuthentication(auth);

                // Update last-used info asynchronously to avoid blocking
                key.setLastUsedAt(LocalDateTime.now());
                key.setLastUsedIp(request.getRemoteAddr());
                String agentVersion = request.getHeader("X-Agent-Version");
                if (StringUtils.hasText(agentVersion)) {
                    key.setAgentVersion(agentVersion);
                }
                agentApiKeyRepository.save(key);
            } else {
                log.warn("Agent key rejected (prefix={})",
                        rawKey.length() > 8 ? rawKey.substring(0, 8) : "***");
            }
        } catch (Exception e) {
            log.error("Agent auth failure: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    public static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
