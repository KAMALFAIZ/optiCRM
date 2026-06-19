package com.opticrm.tenant.license;

import com.opticrm.tenant.config.DeploymentModeProperties;
import com.opticrm.tenant.entity.Tenant;
import com.opticrm.tenant.repository.TenantRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

/**
 * Validates the on-premise license at startup and exposes license status.
 *
 * <p>La licence est une licence KASOFT signée (JWT RS256) émise par la console et
 * vérifiée avec la clé publique embarquée ({@code /license-public.pem}). Le JWT est
 * stocké dans {@code tenants.license_key}. Claims lus : {@code exp}, {@code customer},
 * {@code product}. Un {@code license_key} qui n'est PAS un JWT KASOFT valide retombe
 * sur l'ancien champ {@code license_expires_at} (rétro-compatibilité).
 * En mode SaaS, ce service est inactif (abonnements gérés autrement).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LicenseService {

    private final DeploymentModeProperties deploymentProps;
    private final TenantRepository tenantRepository;

    @Getter
    private LicenseStatus status = LicenseStatus.UNCHECKED;

    @Getter
    private String statusMessage = "Licence non vérifiée";

    @PostConstruct
    public void validateOnStartup() {
        if (deploymentProps.isOnPremise()) {
            checkLicense();
        } else {
            status = LicenseStatus.NOT_REQUIRED;
            statusMessage = "Mode SaaS — licence non requise";
        }
    }

    private void checkLicense() {
        try {
            UUID defaultTenantId = UUID.fromString(deploymentProps.getDefaultTenantId());
            Tenant tenant = tenantRepository.findById(defaultTenantId).orElse(null);

            if (tenant == null) {
                // First-run: not yet configured
                status = LicenseStatus.NOT_CONFIGURED;
                statusMessage = "Installation non configurée — veuillez accéder à /setup";
                log.warn("OptiCRM on-premise: tenant par défaut introuvable. Accédez à /setup pour configurer.");
                return;
            }

            String licenseKey = tenant.getLicenseKey();
            if (licenseKey == null || licenseKey.isBlank()) {
                // Community mode — no license key required for basic usage
                status = LicenseStatus.COMMUNITY;
                statusMessage = "Mode communautaire — fonctionnalités de base disponibles";
                log.info("OptiCRM on-premise: mode communautaire (sans clé de licence)");
                return;
            }

            // ── Licence KASOFT signée (JWT RS256) ──
            Claims claims = verifySignedLicense(licenseKey);
            if (claims != null) {
                Date exp = claims.getExpiration();
                if (exp != null && exp.before(new Date())) {
                    status = LicenseStatus.EXPIRED;
                    statusMessage = "Licence KASOFT expirée le " + exp + " — contactez support@opticrm.ma";
                    log.error("OptiCRM on-premise: licence KASOFT expirée le {}", exp);
                    return;
                }
                String customer = claims.get("customer", String.class);
                status = LicenseStatus.VALID;
                statusMessage = "Licence KASOFT valide"
                        + (exp != null ? " jusqu'au " + exp : " (sans expiration)")
                        + (customer != null ? " — " + customer : "");
                log.info("OptiCRM on-premise: {}", statusMessage);
                return;
            }

            // ── Repli legacy : ancien champ license_expires_at en base (rétro-compatibilité) ──
            Instant expiresAt = tenant.getLicenseExpiresAt();
            if (expiresAt != null && expiresAt.isBefore(Instant.now())) {
                status = LicenseStatus.EXPIRED;
                statusMessage = "Licence expirée le " + expiresAt + " — contactez support@opticrm.ma";
                log.error("OptiCRM on-premise: licence expirée le {}", expiresAt);
                return;
            }

            status = LicenseStatus.VALID;
            statusMessage = expiresAt != null
                ? "Licence valide jusqu'au " + expiresAt
                : "Licence valide (sans expiration)";
            log.info("OptiCRM on-premise: {}", statusMessage);

        } catch (Exception e) {
            status = LicenseStatus.ERROR;
            statusMessage = "Erreur de validation de licence : " + e.getMessage();
            log.error("Erreur validation licence: {}", e.getMessage());
        }
    }

    /**
     * Vérifie une licence KASOFT signée (JWT RS256) avec la clé publique embarquée.
     * Renvoie les claims si la signature est valide, ou {@code null} si le jeton
     * n'est pas un JWT KASOFT valide (→ repli sur l'ancien champ d'expiration).
     */
    private Claims verifySignedLicense(String jwt) {
        try {
            return Jwts.parser()
                    .verifyWith(loadPublicKey())
                    .build()
                    .parseSignedClaims(jwt)
                    .getPayload();
        } catch (Exception e) {
            log.debug("license_key n'est pas un JWT KASOFT valide (repli legacy) : {}", e.getMessage());
            return null;
        }
    }

    private PublicKey loadPublicKey() throws Exception {
        try (InputStream is = getClass().getResourceAsStream("/license-public.pem")) {
            if (is == null) {
                throw new IllegalStateException("license-public.pem introuvable dans le classpath");
            }
            String pem = new String(is.readAllBytes(), StandardCharsets.UTF_8)
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] der = Base64.getDecoder().decode(pem);
            return KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(der));
        }
    }

    public boolean isOperational() {
        return status == LicenseStatus.VALID
            || status == LicenseStatus.COMMUNITY
            || status == LicenseStatus.NOT_REQUIRED
            || status == LicenseStatus.NOT_CONFIGURED; // allow setup wizard to run
    }

    public enum LicenseStatus {
        UNCHECKED, NOT_REQUIRED, NOT_CONFIGURED, COMMUNITY, VALID, EXPIRED, ERROR
    }
}
