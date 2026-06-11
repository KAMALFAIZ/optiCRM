package com.opticrm.api.sage;

import com.opticrm.api.sage.dto.ExecuteQueryRequest;
import com.opticrm.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/sage/query")
@RequiredArgsConstructor
public class SageQueryController {

    private final SageQueryService sageQueryService;

    /** Récupère les comptes clients directement depuis Sage SQL Server */
    @GetMapping("/accounts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> fetchAccounts() {
        return ResponseEntity.ok(ApiResponse.success(sageQueryService.fetchAccounts()));
    }

    /** Récupère les contacts directement depuis Sage SQL Server */
    @GetMapping("/contacts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> fetchContacts() {
        return ResponseEntity.ok(ApiResponse.success(sageQueryService.fetchContacts()));
    }

    /** Exécute une requête SQL personnalisée sur le serveur Sage */
    @PostMapping("/execute")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> executeQuery(
            @Valid @RequestBody ExecuteQueryRequest req) {
        List<Map<String, Object>> rows = sageQueryService.executeCustomQuery(req.getQuery(), req.getEntityType());
        return ResponseEntity.ok(ApiResponse.success(rows));
    }

    /** Teste la connexion au serveur Sage SQL Server */
    @GetMapping("/test")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<Void>> testConnection() {
        sageQueryService.testConnection();
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
