package com.opticrm.api.migration;

import com.opticrm.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Endpoint pour déclencher la migration des données
 * depuis SQL Server GROUPE_ALBOUGHAZE → OptiCRM
 *
 *  POST /api/v1/admin/migration/run   → lance la migration (SUPER_ADMIN only)
 *  GET  /api/v1/admin/migration/status → état de la migration
 */
@RestController
@RequestMapping("/api/v1/admin/migration")
@RequiredArgsConstructor
@Slf4j
public class DataMigrationController {

    private final DataMigrationService migrationService;

    /**
     * Lancer la migration complète.
     * Accessible uniquement par SUPER_ADMIN.
     */
    @PostMapping("/run")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<Map<String, Object>> runMigration() {
        log.info("Migration déclenchée via API par un super-admin");
        try {
            Map<String, Object> result = migrationService.runMigration();
            return ApiResponse.success(result);
        } catch (Exception e) {
            log.error("Erreur durant la migration", e);
            return ApiResponse.error("MIGRATION_ERROR", e.getMessage());
        }
    }

    /**
     * Enrichir les contacts existants avec les données manquantes depuis SQL Server
     * (email, salutation, téléphone, téléphone compte).
     * Accessible uniquement par SUPER_ADMIN.
     */
    @PostMapping("/enrich-contacts")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<Map<String, Object>> enrichContacts() {
        log.info("Enrichissement contacts déclenché via API");
        try {
            Map<String, Object> result = migrationService.enrichContacts();
            return ApiResponse.success(result);
        } catch (Exception e) {
            log.error("Erreur durant l'enrichissement contacts", e);
            return ApiResponse.error("ENRICH_ERROR", e.getMessage());
        }
    }

    /**
     * Consulter l'état de la migration (running / stats).
     */
    @GetMapping("/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<Map<String, Object>> getStatus() {
        return ApiResponse.success(migrationService.getStatus());
    }
}
