package com.opticrm.core.ticket.service;

import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.contact.entity.Contact;
import com.opticrm.core.contact.repository.ContactRepository;
import com.opticrm.core.ticket.dto.*;
import com.opticrm.core.ticket.entity.Ticket;
import com.opticrm.core.ticket.entity.TicketComment;
import com.opticrm.core.ticket.repository.TicketCommentRepository;
import com.opticrm.core.ticket.repository.TicketRepository;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.UserRepository;
import com.opticrm.security.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository commentRepository;
    private final AccountRepository accountRepository;
    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
    private final SecurityService securityService;

    // ── Lecture ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<TicketListDto> findAll(
            Ticket.TicketStatus status,
            Ticket.TicketCategory category,
            Ticket.TicketPriority priority,
            UUID accountId,
            UUID assignedToId,
            String search,
            Pageable pageable) {

        Page<Ticket> page;
        if (search != null && !search.isBlank()) {
            page = ticketRepository.search(search.trim(), pageable);
        } else {
            page = ticketRepository.findWithFilters(status, category, priority, accountId, assignedToId, pageable);
        }
        return page.map(this::toListDto);
    }

    @Transactional(readOnly = true)
    public TicketDto findById(UUID id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket non trouvé"));
        return toDto(ticket, true);
    }

    @Transactional(readOnly = true)
    public Page<TicketListDto> findByAccount(UUID accountId, Pageable pageable) {
        return ticketRepository.findByAccountId(accountId, pageable).map(this::toListDto);
    }

    @Transactional(readOnly = true)
    public TicketStatsDto getStats() {
        Instant now = Instant.now();
        Map<String, Long> parCategorie = new HashMap<>();
        ticketRepository.countByCategories().forEach(row -> {
            if (row[0] != null) parCategorie.put(row[0].toString(), ((Number) row[1]).longValue());
        });
        Map<String, Long> parPriorite = new HashMap<>();
        ticketRepository.countByPriorities().forEach(row -> {
            if (row[0] != null) parPriorite.put(row[0].toString(), ((Number) row[1]).longValue());
        });
        return TicketStatsDto.builder()
                .total(ticketRepository.count())
                .ouverts(ticketRepository.countByStatus(Ticket.TicketStatus.OUVERT))
                .enCours(ticketRepository.countByStatus(Ticket.TicketStatus.EN_COURS))
                .enAttente(ticketRepository.countByStatus(Ticket.TicketStatus.EN_ATTENTE))
                .resolus(ticketRepository.countByStatus(Ticket.TicketStatus.RESOLU))
                .fermes(ticketRepository.countByStatus(Ticket.TicketStatus.FERME))
                .slaBreached(ticketRepository.countSlaBreached(now,
                        List.of(Ticket.TicketStatus.RESOLU, Ticket.TicketStatus.FERME)))
                .critiques(ticketRepository.countByPriority(Ticket.TicketPriority.CRITIQUE))
                .parCategorie(parCategorie)
                .parPriorite(parPriorite)
                .build();
    }

    // ── Écriture ───────────────────────────────────────────────────────────

    public TicketDto create(CreateTicketRequest req) {
        User currentUser = securityService.getCurrentUser();
        String reference = generateReference();

        Ticket ticket = Ticket.builder()
                .reference(reference)
                .title(req.getTitle())
                .description(req.getDescription())
                .category(req.getCategory() != null ? req.getCategory() : Ticket.TicketCategory.AUTRE)
                .priority(req.getPriority() != null ? req.getPriority() : Ticket.TicketPriority.NORMALE)
                .status(Ticket.TicketStatus.OUVERT)
                .slaDeadline(computeSlaDeadline(req.getPriority()))
                .createdBy(currentUser)
                .build();

        applyRelations(ticket, req.getAccountId(), req.getContactId(), req.getAssignedToId());
        ticket = ticketRepository.save(ticket);
        return toDto(ticket, false);
    }

    public TicketDto update(UUID id, UpdateTicketRequest req) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket non trouvé"));

        ticket.setTitle(req.getTitle());
        ticket.setDescription(req.getDescription());
        if (req.getCategory() != null) ticket.setCategory(req.getCategory());
        if (req.getPriority() != null) {
            ticket.setPriority(req.getPriority());
            if (ticket.getSlaDeadline() == null) {
                ticket.setSlaDeadline(computeSlaDeadline(req.getPriority()));
            }
        }
        if (req.getStatus() != null) applyStatusTransition(ticket, req.getStatus());

        applyRelations(ticket, req.getAccountId(), req.getContactId(), req.getAssignedToId());
        ticket = ticketRepository.save(ticket);
        return toDto(ticket, false);
    }

    public TicketDto changeStatus(UUID id, Ticket.TicketStatus newStatus) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket non trouvé"));
        applyStatusTransition(ticket, newStatus);
        ticket = ticketRepository.save(ticket);
        return toDto(ticket, false);
    }

    public void delete(UUID id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket non trouvé"));
        ticketRepository.delete(ticket);
    }

    // ── Commentaires ───────────────────────────────────────────────────────

    public TicketCommentDto addComment(UUID ticketId, AddCommentRequest req) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket non trouvé"));
        User currentUser = securityService.getCurrentUser();

        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .content(req.getContent())
                .internal(req.isInternal())
                .author(currentUser)
                .build();

        // Auto-passer en EN_COURS si OUVERT
        if (ticket.getStatus() == Ticket.TicketStatus.OUVERT) {
            ticket.setStatus(Ticket.TicketStatus.EN_COURS);
            ticketRepository.save(ticket);
        }

        comment = commentRepository.save(comment);
        return toCommentDto(comment);
    }

    @Transactional(readOnly = true)
    public List<TicketCommentDto> getComments(UUID ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream().map(this::toCommentDto).toList();
    }

    // ── Helpers privés ─────────────────────────────────────────────────────

    private void applyStatusTransition(Ticket ticket, Ticket.TicketStatus newStatus) {
        ticket.setStatus(newStatus);
        if (newStatus == Ticket.TicketStatus.RESOLU && ticket.getResolvedAt() == null) {
            ticket.setResolvedAt(Instant.now());
        }
        if (newStatus == Ticket.TicketStatus.FERME && ticket.getClosedAt() == null) {
            ticket.setClosedAt(Instant.now());
        }
    }

    private void applyRelations(Ticket ticket, UUID accountId, UUID contactId, UUID assignedToId) {
        ticket.setAccount(accountId != null
                ? accountRepository.findById(accountId).orElseThrow(() -> new ResourceNotFoundException("Compte non trouvé"))
                : null);
        ticket.setContact(contactId != null
                ? contactRepository.findById(contactId).orElseThrow(() -> new ResourceNotFoundException("Contact non trouvé"))
                : null);
        ticket.setAssignedTo(assignedToId != null
                ? userRepository.findById(assignedToId).orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"))
                : null);
    }

    private Instant computeSlaDeadline(Ticket.TicketPriority priority) {
        if (priority == null) priority = Ticket.TicketPriority.NORMALE;
        long hours = switch (priority) {
            case CRITIQUE -> 24;
            case HAUTE    -> 48;
            case NORMALE  -> 120; // 5j
            case BASSE    -> 240; // 10j
        };
        return Instant.now().plus(hours, ChronoUnit.HOURS);
    }

    private String generateReference() {
        Integer max = ticketRepository.findMaxTicketNumber();
        int next = (max != null ? max : 0) + 1;
        return String.format("TKT-%05d", next);
    }

    private boolean isSlaBreached(Ticket t) {
        return t.getSlaDeadline() != null
                && Instant.now().isAfter(t.getSlaDeadline())
                && t.getStatus() != Ticket.TicketStatus.RESOLU
                && t.getStatus() != Ticket.TicketStatus.FERME;
    }

    private TicketDto toDto(Ticket t, boolean withComments) {
        List<TicketCommentDto> comments = withComments
                ? commentRepository.findByTicketIdOrderByCreatedAtAsc(t.getId()).stream().map(this::toCommentDto).toList()
                : List.of();

        return TicketDto.builder()
                .id(t.getId())
                .reference(t.getReference())
                .title(t.getTitle())
                .description(t.getDescription())
                .category(t.getCategory())
                .priority(t.getPriority())
                .status(t.getStatus())
                .slaDeadline(t.getSlaDeadline())
                .slaBreached(isSlaBreached(t))
                .resolvedAt(t.getResolvedAt())
                .closedAt(t.getClosedAt())
                .account(t.getAccount() != null ? TicketDto.RelatedDto.builder()
                        .id(t.getAccount().getId()).name(t.getAccount().getName()).build() : null)
                .contact(t.getContact() != null ? TicketDto.RelatedDto.builder()
                        .id(t.getContact().getId())
                        .name(t.getContact().getFirstName() + " " + t.getContact().getLastName()).build() : null)
                .assignedTo(t.getAssignedTo() != null ? TicketDto.UserSummaryDto.builder()
                        .id(t.getAssignedTo().getId())
                        .fullName(t.getAssignedTo().getFullName())
                        .email(t.getAssignedTo().getEmail()).build() : null)
                .createdBy(t.getCreatedBy() != null ? TicketDto.UserSummaryDto.builder()
                        .id(t.getCreatedBy().getId())
                        .fullName(t.getCreatedBy().getFullName())
                        .email(t.getCreatedBy().getEmail()).build() : null)
                .comments(comments)
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    private TicketListDto toListDto(Ticket t) {
        int commentsCount = commentRepository.countByTicketId(t.getId());
        return TicketListDto.builder()
                .id(t.getId())
                .reference(t.getReference())
                .title(t.getTitle())
                .category(t.getCategory())
                .priority(t.getPriority())
                .status(t.getStatus())
                .slaDeadline(t.getSlaDeadline())
                .slaBreached(isSlaBreached(t))
                .accountId(t.getAccount() != null ? t.getAccount().getId() : null)
                .accountName(t.getAccount() != null ? t.getAccount().getName() : null)
                .contactId(t.getContact() != null ? t.getContact().getId() : null)
                .contactName(t.getContact() != null
                        ? t.getContact().getFirstName() + " " + t.getContact().getLastName() : null)
                .assignedToId(t.getAssignedTo() != null ? t.getAssignedTo().getId() : null)
                .assignedToName(t.getAssignedTo() != null ? t.getAssignedTo().getFullName() : null)
                .commentsCount(commentsCount)
                .createdAt(t.getCreatedAt())
                .resolvedAt(t.getResolvedAt())
                .build();
    }

    private TicketCommentDto toCommentDto(TicketComment c) {
        return TicketCommentDto.builder()
                .id(c.getId())
                .content(c.getContent())
                .internal(c.isInternal())
                .authorId(c.getAuthor() != null ? c.getAuthor().getId() : null)
                .authorName(c.getAuthor() != null ? c.getAuthor().getFullName() : null)
                .createdAt(c.getCreatedAt())
                .build();
    }
}
