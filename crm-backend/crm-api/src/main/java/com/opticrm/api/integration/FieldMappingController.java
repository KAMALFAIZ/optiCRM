package com.opticrm.api.integration;

import com.opticrm.api.integration.dto.FieldMappingDto;
import com.opticrm.api.integration.dto.ImportResultDto;
import com.opticrm.api.integration.dto.SaveMappingsRequest;
import com.opticrm.api.integration.ExecuteQueryRequest;
import com.opticrm.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/integration")
@RequiredArgsConstructor
public class FieldMappingController {

    private final FieldMappingService fieldMappingService;

    /** Récupérer les mappings d'un type d'entité (ACCOUNTS ou PRODUCTS) */
    @GetMapping("/mappings")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<FieldMappingDto>>> getMappings(
            @RequestParam(defaultValue = "ACCOUNTS") String type) {
        return ResponseEntity.ok(ApiResponse.success(fieldMappingService.getMappings(type)));
    }

    /** Sauvegarder (remplacer) les mappings d'un type d'entité */
    @PostMapping("/mappings")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<List<FieldMappingDto>>> saveMappings(
            @RequestBody SaveMappingsRequest req,
            @RequestParam(defaultValue = "ACCOUNTS") String type) {
        return ResponseEntity.ok(ApiResponse.success(fieldMappingService.saveMappings(req, type)));
    }

    /** Importer un fichier CSV via les mappings du type d'entité */
    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ImportResultDto>> importCsv(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "ACCOUNTS") String type) throws Exception {
        return ResponseEntity.ok(ApiResponse.success(fieldMappingService.importCsv(file, type)));
    }

    /** Supprimer TOUS les produits */
    @DeleteMapping("/all-products")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<Integer>> deleteAllProducts() {
        return ResponseEntity.ok(ApiResponse.success(fieldMappingService.deleteAllProducts()));
    }

    /** Supprimer TOUS les comptes et données liées (TRUNCATE CASCADE) */
    @DeleteMapping("/all-accounts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<Void>> deleteAllAccounts() {
        fieldMappingService.deleteAllAccounts();
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** Supprimer tous les comptes dont le nom commence par "Import-" (imports ratés) */
    @DeleteMapping("/imported-accounts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<Integer>> deleteImportedAccounts() {
        return ResponseEntity.ok(ApiResponse.success(fieldMappingService.deleteImportedAccounts()));
    }

    /** Exécuter une requête SQL sur le serveur Sage et importer les résultats */
    @PostMapping("/execute-query")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER', 'SUPERVISEUR')")
    public ResponseEntity<ApiResponse<ImportResultDto>> executeQuery(
            @RequestBody ExecuteQueryRequest req,
            @RequestParam(defaultValue = "ACCOUNTS") String type) {
        return ResponseEntity.ok(ApiResponse.success(
                fieldMappingService.executeQueryAndImport(req.getSqlQuery(), type)));
    }
}
