package com.opticrm.core.account.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageMeta;
import com.opticrm.common.dto.PageRequest;
import com.opticrm.core.account.dto.*;
import com.opticrm.core.account.service.AccountService;
import com.opticrm.core.account.service.HealthScoreService;
import com.opticrm.core.contact.dto.ContactListDto;
import com.opticrm.core.contact.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final ContactService contactService;
    private final HealthScoreService healthScoreService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<List<AccountListDto>>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String accountType,
            @RequestParam(required = false) String assignedToId,
            @RequestParam(required = false) String territoryId,
            @RequestParam(required = false) Boolean hasSageCode,
            @RequestParam(required = false) String societeAffectation
    ) {
        PageRequest pageRequest = PageRequest.builder()
                .page(page)
                .perPage(perPage)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .build();

        Page<AccountListDto> result = accountService.list(pageRequest, search, accountType, assignedToId, territoryId, hasSageCode, societeAffectation);

        return ResponseEntity.ok(ApiResponse.success(
                result.getContent(),
                PageMeta.from(result)
        ));
    }

    @GetMapping("/geolocated")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<List<AccountListDto>>> getGeolocated() {
        return ResponseEntity.ok(ApiResponse.success(accountService.getAllGeolocated()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<AccountDto>> getById(@PathVariable UUID id) {
        AccountDto account = accountService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(account));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL')")
    public ResponseEntity<ApiResponse<AccountDto>> create(
            @Valid @RequestBody CreateAccountRequest request
    ) {
        AccountDto account = accountService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(account));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL')")
    public ResponseEntity<ApiResponse<AccountDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAccountRequest request
    ) {
        AccountDto account = accountService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(account));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        accountService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/{id}/contacts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<List<ContactListDto>>> getContacts(@PathVariable UUID id) {
        List<ContactListDto> contacts = contactService.getByAccountId(id);
        return ResponseEntity.ok(ApiResponse.success(contacts));
    }

    @GetMapping("/{id}/children")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<List<AccountListDto>>> getChildAccounts(@PathVariable UUID id) {
        List<AccountListDto> children = accountService.getChildAccounts(id);
        return ResponseEntity.ok(ApiResponse.success(children));
    }

    @GetMapping("/stats/by-type")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStatsByType() {
        Map<String, Long> stats = accountService.getAccountTypeStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // ── Score Santé ─────────────────────────────────────────────────────────

    /**
     * Calcule et retourne le Score Santé du compte (dynamique, non persisté).
     * GET /api/v1/accounts/{id}/health-score
     */
    @GetMapping("/{id}/health-score")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL', 'READ_ONLY')")
    public ResponseEntity<ApiResponse<HealthScoreDto>> getHealthScore(@PathVariable UUID id) {
        HealthScoreDto score = healthScoreService.compute(id);
        return ResponseEntity.ok(ApiResponse.success(score));
    }

    /**
     * Recalcule et persiste le Score Santé dans account_score.
     * POST /api/v1/accounts/{id}/health-score/refresh
     */
    @PostMapping("/{id}/health-score/refresh")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL')")
    public ResponseEntity<ApiResponse<HealthScoreDto>> refreshHealthScore(@PathVariable UUID id) {
        HealthScoreDto score = healthScoreService.computeAndPersist(id);
        return ResponseEntity.ok(ApiResponse.success(score));
    }

    // -----------------------------------------------------------------------
    // Photo gallery endpoints
    // -----------------------------------------------------------------------

    @PostMapping(value = "/{id}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL')")
    public ResponseEntity<ApiResponse<AccountDto>> uploadLogo(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        AccountDto account = accountService.uploadLogo(id, file);
        return ResponseEntity.ok(ApiResponse.success(account));
    }

    @PostMapping(value = "/{id}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL')")
    public ResponseEntity<ApiResponse<AccountPhotoDto>> uploadPhoto(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption
    ) throws IOException {
        AccountPhotoDto photo = accountService.uploadPhoto(id, file, caption);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(photo));
    }

    @DeleteMapping("/{id}/photos/{photoId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'COMMERCIAL')")
    public ResponseEntity<ApiResponse<Void>> deletePhoto(
            @PathVariable UUID id,
            @PathVariable UUID photoId
    ) {
        accountService.deletePhoto(id, photoId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
