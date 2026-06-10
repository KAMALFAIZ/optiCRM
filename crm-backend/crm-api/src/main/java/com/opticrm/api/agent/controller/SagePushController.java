package com.opticrm.api.agent.controller;

import com.opticrm.api.sage.SageIntegrationService;
import com.opticrm.api.sage.dto.CreateSyncRequestRequest;
import com.opticrm.api.sage.dto.SageSyncRequestDto;
import com.opticrm.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint d'ingestion utilisé par l'agent local pour pousser les données Sage → CRM.
 * Réutilise la logique existante de SageIntegrationService.
 *
 * URL : POST /api/v1/sage/push?autoApply=true
 * Auth : X-Agent-Key (cf. AgentSecurityConfig)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/sage")
@RequiredArgsConstructor
public class SagePushController {

    private final SageIntegrationService sageIntegrationService;

    @PostMapping("/push")
    public ResponseEntity<ApiResponse<SageSyncRequestDto>> push(
            @Valid @RequestBody CreateSyncRequestRequest req,
            @RequestParam(defaultValue = "true") boolean autoApply) {

        if (req.getSourceFormat() == null) {
            req.setSourceFormat("SAGE_AGENT");
        }
        if (req.getLabel() == null) {
            req.setLabel("Push agent — " + req.getEntityType());
        }

        log.info("[Agent push] entityType={} rows={} autoApply={}",
                req.getEntityType(), req.getRows().size(), autoApply);

        SageSyncRequestDto created = sageIntegrationService.createRequest(req);

        if (autoApply && created.getId() != null) {
            SageSyncRequestDto applied = sageIntegrationService.applyRequest(created.getId());
            return ResponseEntity.ok(ApiResponse.success(applied));
        }
        return ResponseEntity.ok(ApiResponse.success(created));
    }
}
