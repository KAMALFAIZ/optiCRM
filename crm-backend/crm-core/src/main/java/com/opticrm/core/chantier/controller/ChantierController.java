package com.opticrm.core.chantier.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageMeta;
import com.opticrm.common.dto.PageRequest;
import com.opticrm.core.chantier.dto.*;
import com.opticrm.core.chantier.service.ChantierService;
import com.opticrm.core.chantier.service.ChantierEchantillonService;
import com.opticrm.core.chantier.service.ChantierPhotoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chantiers")
@RequiredArgsConstructor
public class ChantierController {

    private final ChantierService chantierService;
    private final ChantierEchantillonService echantillonService;
    private final ChantierPhotoService photoService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL','READ_ONLY')")
    public ResponseEntity<ApiResponse<List<ChantierListDto>>> list(
            PageRequest pageRequest,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String stadeChantier,
            @RequestParam(required = false) String statutChantier,
            @RequestParam(required = false) String typeProjet,
            @RequestParam(required = false) String assignedToId,
            @RequestParam(required = false) String accountId,
            @RequestParam(required = false) Boolean temoin) {

        Page<ChantierListDto> page = chantierService.list(
                pageRequest, search, stadeChantier, statutChantier, typeProjet, assignedToId, accountId, temoin);

        return ResponseEntity.ok(ApiResponse.success(
                page.getContent(),
                PageMeta.from(page)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL','READ_ONLY')")
    public ResponseEntity<ApiResponse<ChantierDto>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(chantierService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL')")
    public ResponseEntity<ApiResponse<ChantierDto>> create(@Valid @RequestBody CreateChantierRequest request) {
        ChantierDto dto = chantierService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL')")
    public ResponseEntity<ApiResponse<ChantierDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateChantierRequest request) {
        return ResponseEntity.ok(ApiResponse.success(chantierService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        chantierService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // Acteurs liés
    @PostMapping("/{id}/acteurs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL')")
    public ResponseEntity<ApiResponse<ChantierActeurDto>> addActeur(
            @PathVariable UUID id,
            @Valid @RequestBody CreateChantierRequest.ActeurRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(chantierService.addActeur(id, request)));
    }

    @DeleteMapping("/{id}/acteurs/{acteurId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL')")
    public ResponseEntity<ApiResponse<Void>> removeActeur(
            @PathVariable UUID id,
            @PathVariable UUID acteurId) {
        chantierService.removeActeur(id, acteurId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // Demandes d'échantillons
    @PostMapping("/{id}/echantillons")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL')")
    public ResponseEntity<ApiResponse<ChantierEchantillonDto>> createEchantillon(
            @PathVariable UUID id,
            @Valid @RequestBody CreateEchantillonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(echantillonService.create(id, request)));
    }

    @GetMapping("/{id}/echantillons")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL','READ_ONLY')")
    public ResponseEntity<ApiResponse<List<ChantierEchantillonDto>>> getEchantillons(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(echantillonService.findByChantier(id)));
    }

    // Photos du chantier
    @PostMapping("/{id}/photos")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL')")
    public ResponseEntity<ApiResponse<ChantierPhotoDto>> uploadPhoto(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(photoService.upload(id, file)));
    }

    @GetMapping("/{id}/photos")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL','READ_ONLY')")
    public ResponseEntity<ApiResponse<List<ChantierPhotoDto>>> getPhotos(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(photoService.findByChantier(id)));
    }

    @DeleteMapping("/{id}/photos/{photoId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL')")
    public ResponseEntity<ApiResponse<Void>> deletePhoto(
            @PathVariable UUID id,
            @PathVariable UUID photoId) throws IOException {
        photoService.delete(id, photoId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // Carte interactive : chantiers géolocalisés
    @GetMapping("/map")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL','READ_ONLY')")
    public ResponseEntity<ApiResponse<List<ChantierListDto>>> getMapData() {
        return ResponseEntity.ok(ApiResponse.success(chantierService.findAllWithGps()));
    }

    // Chantiers liés à un compte
    @GetMapping("/by-account/{accountId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','COMMERCIAL','READ_ONLY')")
    public ResponseEntity<ApiResponse<List<ChantierListDto>>> getByAccount(@PathVariable UUID accountId) {
        return ResponseEntity.ok(ApiResponse.success(chantierService.findByAccount(accountId)));
    }
}
