package com.opticrm.core.ticket.controller;

import com.opticrm.common.dto.ApiResponse;
import com.opticrm.common.dto.PageResponse;
import com.opticrm.core.ticket.dto.*;
import com.opticrm.core.ticket.entity.Ticket;
import com.opticrm.core.ticket.service.TicketService;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
@Tag(name = "Tickets", description = "API de gestion des tickets de support")
public class TicketController {

    private final TicketService ticketService;

    @GetMapping
    @Operation(summary = "Liste des tickets")
    public ResponseEntity<ApiResponse<PageResponse<TicketListDto>>> getAll(
            @RequestParam(required = false) Ticket.TicketStatus status,
            @RequestParam(required = false) Ticket.TicketCategory category,
            @RequestParam(required = false) Ticket.TicketPriority priority,
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) UUID assignedToId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<TicketListDto> result = ticketService.findAll(status, category, priority, accountId, assignedToId, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'un ticket")
    public ResponseEntity<ApiResponse<TicketDto>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(ticketService.findById(id)));
    }

    @GetMapping("/account/{accountId}")
    @Operation(summary = "Tickets d'un compte")
    public ResponseEntity<ApiResponse<PageResponse<TicketListDto>>> getByAccount(
            @PathVariable UUID accountId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(ticketService.findByAccount(accountId, pageable))));
    }

    @GetMapping("/stats")
    @Operation(summary = "Statistiques tickets")
    public ResponseEntity<ApiResponse<TicketStatsDto>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(ticketService.getStats()));
    }

    @PostMapping
    @Operation(summary = "Créer un ticket")
    public ResponseEntity<ApiResponse<TicketDto>> create(@Valid @RequestBody CreateTicketRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(ticketService.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier un ticket")
    public ResponseEntity<ApiResponse<TicketDto>> update(
            @PathVariable UUID id, @Valid @RequestBody UpdateTicketRequest request) {
        return ResponseEntity.ok(ApiResponse.success(ticketService.update(id, request)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Changer le statut d'un ticket")
    public ResponseEntity<ApiResponse<TicketDto>> changeStatus(
            @PathVariable UUID id, @RequestParam Ticket.TicketStatus status) {
        return ResponseEntity.ok(ApiResponse.success(ticketService.changeStatus(id, status)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un ticket")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        ticketService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/comments")
    @Operation(summary = "Ajouter un commentaire")
    public ResponseEntity<ApiResponse<TicketCommentDto>> addComment(
            @PathVariable UUID id, @Valid @RequestBody AddCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ticketService.addComment(id, request)));
    }

    @GetMapping("/{id}/comments")
    @Operation(summary = "Liste des commentaires d'un ticket")
    public ResponseEntity<ApiResponse<List<TicketCommentDto>>> getComments(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(ticketService.getComments(id)));
    }
}
