package com.opticrm.core.tour.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateExpenseReportRequest {

    @Size(max = 255, message = "Le titre ne peut pas dépasser 255 caractères")
    private String title;

    private String description;

    @Size(max = 3, message = "Le code devise ne peut pas dépasser 3 caractères")
    private String currency;

    @Valid
    private List<ExpenseReportLineRequest> lines;
}
