package com.opticrm.core.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddCommentRequest {

    @NotBlank(message = "Le contenu du commentaire est obligatoire")
    private String content;

    private boolean internal = false;
}
