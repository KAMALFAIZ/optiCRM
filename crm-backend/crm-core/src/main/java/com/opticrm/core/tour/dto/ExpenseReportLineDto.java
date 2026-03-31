package com.opticrm.core.tour.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseReportLineDto {

    private UUID id;
    private String category;
    private String description;
    private BigDecimal amount;
    private LocalDate expenseDate;
    private String receiptUrl;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String address;
    private Integer sortOrder;
}
