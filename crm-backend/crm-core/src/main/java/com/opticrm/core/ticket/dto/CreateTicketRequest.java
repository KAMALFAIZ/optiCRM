package com.opticrm.core.ticket.dto;

import com.opticrm.core.ticket.entity.Ticket;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTicketRequest {

    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 300)
    private String title;

    private String description;

    private Ticket.TicketCategory category = Ticket.TicketCategory.AUTRE;

    private Ticket.TicketPriority priority = Ticket.TicketPriority.NORMALE;

    private UUID accountId;
    private UUID contactId;
    private UUID assignedToId;
}
