package com.opticrm.api.agent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ExportResultRequest(
        @NotNull  UUID exportId,
        @NotBlank String status,    // SUCCESS | ERROR | RETRY
        String sagePiece,           // DO_Piece généré par Sage
        String errorMessage
) {}
