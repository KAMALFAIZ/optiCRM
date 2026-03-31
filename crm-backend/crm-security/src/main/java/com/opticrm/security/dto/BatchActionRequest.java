package com.opticrm.security.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchActionRequest {
    @NotEmpty(message = "La liste des identifiants ne peut pas être vide")
    private List<UUID> ids;
}
