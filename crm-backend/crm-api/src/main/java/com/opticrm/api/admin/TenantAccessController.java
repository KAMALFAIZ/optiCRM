package com.opticrm.api.admin;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.security.entity.PasswordResetToken;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.PasswordResetTokenRepository;
import com.opticrm.security.repository.UserRepository;
import com.opticrm.tenant.context.TenantContext;
import com.opticrm.tenant.entity.Tenant;
import com.opticrm.tenant.service.TenantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Génère un lien de premier accès (setup) pour l'administrateur d'un tenant.
 * Requiert ROLE_SUPER_ADMIN.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/superadmin/tenants")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
public class TenantAccessController {

    private final TenantService tenantService;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Value("${app.frontend.url:http://localhost:3009}")
    private String frontendUrl;

    private static final Duration TOKEN_VALIDITY = Duration.ofHours(24);

    /**
     * Génère un lien de connexion initial pour l'admin du tenant.
     * Bascule dans le contexte du tenant, trouve l'utilisateur admin@opticrm.com,
     * crée un token de réinitialisation et retourne l'URL complète.
     */
    @PostMapping("/{id}/generate-access-link")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, String>>> generateAccessLink(
            @PathVariable UUID id
    ) {
        // 1. Récupérer le tenant depuis le contexte système
        Tenant tenant = tenantService.getById(id);

        if (!Boolean.TRUE.equals(tenant.getDbProvisioned())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("DB_NOT_PROVISIONED", "La base de données du tenant n'est pas encore provisionnée."));
        }

        // 2. Basculer dans le contexte du tenant pour accéder à sa base
        UUID previousContext = TenantContext.get();
        try {
            TenantContext.set(tenant.getId());

            // 3. Trouver l'utilisateur admin : email du tenant, puis repli historique,
            //    puis premier administrateur actif trouvé dans la base du tenant.
            String tenantAdminEmail = tenant.getAdminEmail();
            User adminUser = (tenantAdminEmail != null && !tenantAdminEmail.isBlank()
                        ? userRepository.findByEmail(tenantAdminEmail)
                        : Optional.<User>empty())
                    .or(() -> userRepository.findByEmail("admin@opticrm.com"))
                    .or(() -> userRepository.findAllActive().stream()
                            .filter(u -> u.getRole() != null
                                    && ("ADMIN".equalsIgnoreCase(u.getRole().getName())
                                        || "SUPER_ADMIN".equalsIgnoreCase(u.getRole().getName())))
                            .findFirst())
                    .orElseThrow(() -> new RuntimeException("Aucun utilisateur administrateur trouvé dans la base du tenant"));

            // 4. Invalider les anciens tokens
            passwordResetTokenRepository.invalidateAllForUser(adminUser.getId(), Instant.now());

            // 5. Créer un nouveau token valable 24h
            PasswordResetToken token = PasswordResetToken.builder()
                    .token(UUID.randomUUID().toString())
                    .user(adminUser)
                    .expiresAt(Instant.now().plus(TOKEN_VALIDITY))
                    .build();
            passwordResetTokenRepository.save(token);

            String setupUrl = frontendUrl + "/reset-password?token=" + token.getToken();
            log.info("Lien d'accès généré pour le tenant {} ({}): {}", tenant.getSlug(), tenant.getName(), setupUrl);

            return ResponseEntity.ok(ApiResponse.success(Map.of(
                    "url", setupUrl,
                    "adminEmail", adminUser.getEmail(),
                    "expiresIn", "24h"
            )));

        } finally {
            // 6. Restaurer le contexte précédent
            if (previousContext != null) TenantContext.set(previousContext);
            else TenantContext.clear();
        }
    }
}
