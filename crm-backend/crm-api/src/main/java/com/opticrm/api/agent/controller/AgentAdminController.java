package com.opticrm.api.agent.controller;

import com.opticrm.api.agent.dto.AgentKeyCreatedDto;
import com.opticrm.api.agent.dto.AgentStatusDto;
import com.opticrm.api.agent.service.AgentKeyService;
import com.opticrm.common.dto.ApiResponse;
import com.opticrm.security.dto.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Administration des clés d'agent depuis le frontend OptiCRM (authentification JWT classique).
 */
@RestController
@RequestMapping("/api/v1/admin/agent")
@RequiredArgsConstructor
public class AgentAdminController {

    private final AgentKeyService agentKeyService;

    @GetMapping("/keys")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<List<AgentStatusDto>>> list() {
        return ResponseEntity.ok(ApiResponse.success(agentKeyService.list()));
    }

    @PostMapping("/keys")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<AgentKeyCreatedDto>> create(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal user) {
        String label = body.getOrDefault("label", "Agent Sage");
        UUID createdBy = user == null ? null : user.getId();
        return ResponseEntity.ok(ApiResponse.success(agentKeyService.generate(label, createdBy)));
    }

    @DeleteMapping("/keys/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> revoke(@PathVariable UUID id) {
        agentKeyService.revoke(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
