package com.opticrm.finance.dto;

import com.opticrm.finance.entity.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDto {

    private UUID id;
    private String paymentNumber;
    private AccountSummaryDto account;
    private LocalDate paymentDate;
    private BigDecimal amount;
    private String currency;
    private Payment.PaymentMethod paymentMethod;
    private String reference;
    private String bankAccount;
    private Payment.PaymentStatus status;
    private String notes;
    private UserSummaryDto createdBy;
    private List<PaymentAllocationDto> allocations;
    private BigDecimal allocatedAmount;
    private BigDecimal unallocatedAmount;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccountSummaryDto {
        private UUID id;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummaryDto {
        private UUID id;
        private String fullName;
    }
}
