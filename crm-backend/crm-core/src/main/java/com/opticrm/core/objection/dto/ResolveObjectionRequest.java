package com.opticrm.core.objection.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResolveObjectionRequest {

    @NotBlank(message = "La réponse est obligatoire pour résoudre l'objection")
    private String response;
}
