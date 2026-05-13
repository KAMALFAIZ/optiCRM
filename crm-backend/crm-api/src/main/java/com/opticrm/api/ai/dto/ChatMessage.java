package com.opticrm.api.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    @NotBlank
    @Pattern(regexp = "^(user|assistant)$", message = "Role must be 'user' or 'assistant'")
    private String role;

    @NotBlank
    @Size(max = 10000, message = "Message content must not exceed 10000 characters")
    private String content;
}
