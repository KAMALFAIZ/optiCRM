package com.opticrm.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentAllocationDto {

    private UUID id;
    private UUID paymentId;
    private UUID invoiceId;
    private String invoiceNumber;
    private BigDecimal amount;
    private Instant createdAt;
}
