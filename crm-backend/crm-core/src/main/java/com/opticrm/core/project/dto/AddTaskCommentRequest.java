package com.opticrm.core.project.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddTaskCommentRequest {

    @NotBlank(message = "Le contenu est obligatoire")
    private String content;
}
