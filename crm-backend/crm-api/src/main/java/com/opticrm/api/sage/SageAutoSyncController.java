package com.opticrm.api.sage;

import com.opticrm.api.sage.dto.SageSyncRequestDto;
import com.opticrm.common.dto.ApiResponse;
import com.opticrm.security.dto.SageAutoSyncConfigDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sage/auto-sync")
@RequiredArgsConstructor
public class SageAutoSyncController {

    private final SageAutoSyncService sageAutoSyncService;

    @GetMapping("/config")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<SageAutoSyncConfigDto>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success(sageAutoSyncService.getConfig()));
    }

    @PutMapping("/config")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<SageAutoSyncConfigDto>> saveConfig(
            @RequestBody SageAutoSyncConfigDto dto) {
        return ResponseEntity.ok(ApiResponse.success(sageAutoSyncService.saveConfig(dto)));
    }

    @PostMapping("/trigger")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<String>> triggerAll() {
        return ResponseEntity.ok(ApiResponse.success(sageAutoSyncService.triggerAll()));
    }

    @PostMapping("/trigger/{entityType}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<SageSyncRequestDto>> triggerOne(
            @PathVariable String entityType) {
        return ResponseEntity.ok(ApiResponse.success(sageAutoSyncService.triggerOne(entityType)));
    }
}
