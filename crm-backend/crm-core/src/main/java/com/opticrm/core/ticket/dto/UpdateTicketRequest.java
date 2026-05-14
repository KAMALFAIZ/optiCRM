package com.opticrm.core.ticket.dto;

import com.opticrm.core.ticket.entity.Ticket;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTicketRequest {

    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 300)
    private String title;

    private String description;
    private Ticket.TicketCategory category;
    private Ticket.TicketPriority priority;
    private Ticket.TicketStatus status;
    private UUID accountId;
    private UUID contactId;
    private UUID assignedToId;
}
