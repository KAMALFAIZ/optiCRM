package com.opticrm.core.ticket.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketCommentDto {
    private UUID id;
    private String content;
    private boolean internal;
    private UUID authorId;
    private String authorName;
    private Instant createdAt;
}
