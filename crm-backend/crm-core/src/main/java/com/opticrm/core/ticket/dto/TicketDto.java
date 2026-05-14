package com.opticrm.core.ticket.dto;

import com.opticrm.core.ticket.entity.Ticket;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketDto {

    private UUID id;
    private String reference;
    private String title;
    private String description;
    private Ticket.TicketCategory category;
    private Ticket.TicketPriority priority;
    private Ticket.TicketStatus status;
    private Instant slaDeadline;
    private boolean slaBreached;
    private Instant resolvedAt;
    private Instant closedAt;

    private RelatedDto account;
    private RelatedDto contact;
    private UserSummaryDto assignedTo;
    private UserSummaryDto createdBy;

    private List<TicketCommentDto> comments;

    private Instant createdAt;
    private Instant updatedAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RelatedDto {
        private UUID id;
        private String name;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserSummaryDto {
        private UUID id;
        private String fullName;
        private String email;
    }
}
