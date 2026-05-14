package com.opticrm.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatsDto {

    private long totalPayments;
    private BigDecimal totalAmount;
    private BigDecimal monthlyAmount;
    private long monthlyPayments;
    private long pendingPayments;
    private BigDecimal pendingAmount;
}
