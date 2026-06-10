package com.opticrm.api.agent.controller;

import com.opticrm.api.agent.dto.AgentHeartbeatRequest;
import com.opticrm.api.agent.dto.ExportResultRequest;
import com.opticrm.api.agent.dto.PendingExportDto;
import com.opticrm.api.agent.security.AgentPrincipal;
import com.opticrm.api.agent.service.AgentKeyService;
import com.opticrm.api.agent.service.SageExportService;
import com.opticrm.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Endpoints appelés par l'agent local de synchronisation Sage.
 * Authentification : header X-Agent-Key (cf. AgentAuthenticationFilter).
 */
@RestController
@RequestMapping("/api/v1/agent")
@RequiredArgsConstructor
public class AgentController {

    private final AgentKeyService agentKeyService;
    private final SageExportService sageExportService;

    /** Premier appel de l'agent au démarrage : valide la clé et retourne l'identité. */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(
            @AuthenticationPrincipal AgentPrincipal principal,
            @RequestBody(required = false) AgentHeartbeatRequest req) {

        if (req != null) {
            agentKeyService.recordHeartbeat(principal.keyId(), req.agentVersion());
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "tenantId", principal.tenantId(),
                "label",    principal.label() == null ? "" : principal.label(),
                "serverTime", java.time.Instant.now().toString()
        )));
    }

    /** Signal de vie + état Sage côté agent. */
    @PostMapping("/heartbeat")
    public ResponseEntity<ApiResponse<Map<String, String>>> heartbeat(
            @AuthenticationPrincipal AgentPrincipal principal,
            @RequestBody AgentHeartbeatRequest req) {

        agentKeyService.recordHeartbeat(principal.keyId(), req.agentVersion());
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "OK",
                "serverTime", java.time.Instant.now().toString()
        )));
    }

    /** L'agent tire les documents CRM à écrire dans Sage. */
    @GetMapping("/pending-exports")
    public ResponseEntity<ApiResponse<List<PendingExportDto>>> pendingExports(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(ApiResponse.success(sageExportService.nextBatch(limit)));
    }

    /** L'agent confirme l'écriture (ou l'échec) d'un export. */
    @PostMapping("/export-result")
    public ResponseEntity<ApiResponse<Void>> exportResult(
            @Valid @RequestBody ExportResultRequest req) {
        sageExportService.completeExport(req);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
