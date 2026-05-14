package com.opticrm.api.ai.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class ChantierChatRequest {
    @NotNull
    private UUID chantierId;

    @NotNull
    @Size(max = 50, message = "Maximum 50 messages per request")
    @Valid
    private List<ChatMessage> messages;
}
