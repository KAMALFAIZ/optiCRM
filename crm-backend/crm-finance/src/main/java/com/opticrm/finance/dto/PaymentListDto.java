package com.opticrm.finance.dto;

import com.opticrm.finance.entity.Payment;
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
public class PaymentListDto {

    private UUID id;
    private String paymentNumber;
    private String accountName;
    private UUID accountId;
    private LocalDate paymentDate;
    private BigDecimal amount;
    private String currency;
    private Payment.PaymentMethod paymentMethod;
    private String reference;
    private Payment.PaymentStatus status;
    private BigDecimal allocatedAmount;
    private BigDecimal unallocatedAmount;
    private String createdByName;
}
