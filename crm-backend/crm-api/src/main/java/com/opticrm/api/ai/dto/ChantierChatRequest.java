package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class ChantierChatRequest {
    @NotNull
    private UUID chantierId;
    @NotNull
    private List<ChatMessage> messages;
}
