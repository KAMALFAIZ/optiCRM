package com.opticrm.api.ai.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {

    @NotEmpty
    @Size(max = 50, message = "Maximum 50 messages per request")
    @Valid
    private List<ChatMessage> messages;
}
