package com.opticrm.core.tour.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateExpenseReportRequest {

    @NotNull(message = "L'identifiant de la tournée est obligatoire")
    private UUID tourId;

    @NotBlank(message = "Le titre est obligatoire")
    @Size(max = 255, message = "Le titre ne peut pas dépasser 255 caractères")
    private String title;

    private String description;

    @Size(max = 3, message = "Le code devise ne peut pas dépasser 3 caractères")
    private String currency;

    @Valid
    private List<ExpenseReportLineRequest> lines;
}
