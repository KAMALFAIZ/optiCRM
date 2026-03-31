package com.opticrm.tenant.license;

import com.opticrm.tenant.config.DeploymentModeProperties;
import com.opticrm.tenant.entity.Tenant;
import com.opticrm.tenant.repository.TenantRepository;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

/**
 * Validates the on-premise license key at startup and exposes license status.
 * In SaaS mode, this service is inactive (license is managed via Stripe subscriptions).
 *
 * License key format: BASE64(JSON_PAYLOAD).BASE64(RSA_SIGNATURE)
 * where JSON_PAYLOAD = { tenantSlug, maxUsers, plan, expiresAt, issuedAt }
 * Signature validated with the public RSA key bundled in the JAR.
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
