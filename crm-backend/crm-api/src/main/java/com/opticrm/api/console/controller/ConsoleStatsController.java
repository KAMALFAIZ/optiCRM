package com.opticrm.api.console.controller;

import com.opticrm.tenant.config.DeploymentModeProperties;
import com.opticrm.tenant.entity.Tenant;
import com.opticrm.tenant.license.LicenseService;
import com.opticrm.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Endpoint de monitoring lu par la console KASOFT (parc multi-produits).
 * Contrat commun du parc KASOFT (chemin unifié /api/console/instance-stats) :
 *   - GET /api/console/instance-stats avec header X-Console-Token
 *   - 404 si le token n'est pas configuré (endpoint désactivé, défaut)
 *   - 401 si le token est absent ou erroné
 *   - 200 + snapshot JSON sinon
 * Token de service : propriété console.token (env CONSOLE_TOKEN).
 */
@RestController
@RequestMapping("/api/console")
@RequiredArgsConstructor
public class ConsoleStatsController {

    private final TenantRepository tenantRepository;
    private final DeploymentModeProperties deploymentProps;
    private final LicenseService licenseService;

    @Value("${console.token:}")
    private String consoleToken;

    @GetMapping("/instance-stats")
    public ResponseEntity<?> instanceStats(
            @RequestHeader(value = "X-Console-Token", required = false) String token) {

        String expected = consoleToken == null ? "" : consoleToken.trim();
        if (expected.isEmpty()) {
            return ResponseEntity.notFound().build();            // endpoint désactivé
        }
        if (token == null || !token.trim().equals(expected)) {
            return ResponseEntity.status(401).build();
        }

        long tenants = tenantRepository.count();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("version", versionOrDev());
        stats.put("companiesActive", tenants);
        stats.put("companiesTotal", tenants);
        stats.put("licenseStatus", licenseService.getStatus().name());
        stats.put("license", buildLicense(tenants));
        stats.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(stats);
    }

    /** Bloc licence depuis le tenant par défaut (on-premise) — null si indisponible. */
    private Map<String, Object> buildLicense(long tenants) {
        try {
            String defaultTenantId = deploymentProps.getDefaultTenantId();
            if (defaultTenantId == null || defaultTenantId.isBlank()) return null;
            Tenant t = tenantRepository.findById(UUID.fromString(defaultTenantId)).orElse(null);
            if (t == null) return null;
            Map<String, Object> license = new LinkedHashMap<>();
            license.put("customerName", t.getName());
            license.put("maxUsers", t.getMaxUsers());
            license.put("expiryDate", t.getLicenseExpiresAt() != null ? t.getLicenseExpiresAt().toString() : null);
            license.put("usedCompanies", tenants);
            return license;
        } catch (Exception e) {
            return null;
        }
    }

    private String versionOrDev() {
        String v = getClass().getPackage().getImplementationVersion();
        return v != null ? v : "dev";
    }
}
