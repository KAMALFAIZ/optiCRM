package com.opticrm.core.tour.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseReportLineRequest {

    @NotBlank(message = "La catégorie est obligatoire")
    private String category;

    @NotBlank(message = "La description est obligatoire")
    @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
    private String description;

    @NotNull(message = "Le montant est obligatoire")
    private BigDecimal amount;

    @NotNull(message = "La date de dépense est obligatoire")
    private LocalDate expenseDate;

    private String receiptUrl;

    private BigDecimal latitude;
    private BigDecimal longitude;
    @Size(max = 500)
    private String address;

    private Integer sortOrder;
}
