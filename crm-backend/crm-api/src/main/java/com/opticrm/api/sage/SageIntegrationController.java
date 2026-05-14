package com.opticrm.api.sage;

import com.opticrm.api.sage.dto.CreateSyncRequestRequest;
import com.opticrm.api.sage.dto.SageSyncRequestDto;
import com.opticrm.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sage/sync")
@RequiredArgsConstructor
public class SageIntegrationController {

    private final SageIntegrationService sageIntegrationService;

    /** Créer une requête de synchronisation (avec preview auto) */
    @PostMapping("/requests")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<SageSyncRequestDto>> createRequest(
            @Valid @RequestBody CreateSyncRequestRequest req) {
        return ResponseEntity.ok(ApiResponse.success(sageIntegrationService.createRequest(req)));
    }

    /** Appliquer une requête (écriture en base CRM) */
    @PostMapping("/requests/{id}/apply")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<SageSyncRequestDto>> applyRequest(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(sageIntegrationService.applyRequest(id)));
    }

    /** Annuler une requête PENDING */
    @PostMapping("/requests/{id}/cancel")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> cancelRequest(@PathVariable UUID id) {
        sageIntegrationService.cancelRequest(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** Lister les requêtes */
    @GetMapping("/requests")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL','READ_ONLY')")
    public ResponseEntity<ApiResponse<Page<SageSyncRequestDto>>> listRequests(
            @RequestParam(required = false) String entityType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(sageIntegrationService.listRequests(entityType, pageable)));
    }

    /** Détail d'une requête avec ses items */
    @GetMapping("/requests/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL','READ_ONLY')")
    public ResponseEntity<ApiResponse<SageSyncRequestDto>> getRequest(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(sageIntegrationService.getRequest(id)));
    }
}
