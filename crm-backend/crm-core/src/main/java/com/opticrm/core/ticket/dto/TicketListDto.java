package com.opticrm.core.ticket.dto;

import com.opticrm.core.ticket.entity.Ticket;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketListDto {

    private UUID id;
    private String reference;
    private String title;
    private Ticket.TicketCategory category;
    private Ticket.TicketPriority priority;
    private Ticket.TicketStatus status;
    private Instant slaDeadline;
    private boolean slaBreached;

    private UUID accountId;
    private String accountName;
    private UUID contactId;
    private String contactName;
    private UUID assignedToId;
    private String assignedToName;

    private int commentsCount;
    private Instant createdAt;
    private Instant resolvedAt;
}
