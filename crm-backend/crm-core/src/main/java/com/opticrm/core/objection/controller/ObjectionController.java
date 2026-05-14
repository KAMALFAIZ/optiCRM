package com.opticrm.core.objection.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageResponse;
import com.opticrm.core.objection.dto.*;
import com.opticrm.core.objection.entity.Objection;
import com.opticrm.core.objection.service.ObjectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/objections")
@RequiredArgsConstructor
@Tag(name = "Objections", description = "API de gestion des objections commerciales")
public class ObjectionController {

    private final ObjectionService objectionService;

    @GetMapping
    @Operation(summary = "Liste des objections", description = "Récupère la liste paginée des objections avec filtres optionnels")
    public ResponseEntity<ApiResponse<PageResponse<ObjectionListDto>>> getAll(
            @RequestParam(required = false) Objection.ObjectionStatus status,
            @RequestParam(required = false) Objection.ObjectionCategory category,
            @RequestParam(required = false) Objection.ObjectionPriority priority,
            @RequestParam(required = false) UUID assignedToId,
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ObjectionListDto> objections;
        if (search != null && !search.isBlank()) {
            objections = objectionService.search(search.trim(), pageable);
        } else {
            objections = objectionService.findAll(status, category, priority, assignedToId, accountId, pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(objections)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'une objection", description = "Récupère le détail d'une objection par son ID")
    public ResponseEntity<ApiResponse<ObjectionDto>> getById(@PathVariable UUID id) {
        ObjectionDto objection = objectionService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(objection));
    }

    @GetMapping("/account/{accountId}")
    @Operation(summary = "Objections d'un compte", description = "Récupère toutes les objections d'un compte")
    public ResponseEntity<ApiResponse<PageResponse<ObjectionListDto>>> getByAccount(
            @PathVariable UUID accountId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ObjectionListDto> objections = objectionService.findByAccountId(accountId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(objections)));
    }

    @GetMapping("/contact/{contactId}")
    @Operation(summary = "Objections d'un contact", description = "Récupère toutes les objections d'un contact")
    public ResponseEntity<ApiResponse<PageResponse<ObjectionListDto>>> getByContact(
            @PathVariable UUID contactId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ObjectionListDto> objections = objectionService.findByContactId(contactId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(objections)));
    }

    @GetMapping("/opportunity/{opportunityId}")
    @Operation(summary = "Objections d'une opportunité", description = "Récupère toutes les objections d'une opportunité")
    public ResponseEntity<ApiResponse<PageResponse<ObjectionListDto>>> getByOpportunity(
            @PathVariable UUID opportunityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ObjectionListDto> objections = objectionService.findByOpportunityId(opportunityId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(objections)));
    }

    @GetMapping("/stats")
    @Operation(summary = "Statistiques des objections", description = "Récupère les statistiques des objections")
    public ResponseEntity<ApiResponse<ObjectionStatsDto>> getStats() {
        ObjectionStatsDto stats = objectionService.getStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @PostMapping
    @Operation(summary = "Créer une objection", description = "Crée une nouvelle objection")
    public ResponseEntity<ApiResponse<ObjectionDto>> create(@Valid @RequestBody CreateObjectionRequest request) {
        ObjectionDto objection = objectionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(objection));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier une objection", description = "Modifie une objection existante")
    public ResponseEntity<ApiResponse<ObjectionDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateObjectionRequest request) {
        ObjectionDto objection = objectionService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(objection));
    }

    @PostMapping("/{id}/resolve")
    @Operation(summary = "Résoudre une objection", description = "Marque une objection comme résolue avec une réponse")
    public ResponseEntity<ApiResponse<ObjectionDto>> resolve(
            @PathVariable UUID id,
            @Valid @RequestBody ResolveObjectionRequest request) {
        ObjectionDto objection = objectionService.resolve(id, request);
        return ResponseEntity.ok(ApiResponse.success(objection));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une objection", description = "Supprime une objection")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        objectionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
