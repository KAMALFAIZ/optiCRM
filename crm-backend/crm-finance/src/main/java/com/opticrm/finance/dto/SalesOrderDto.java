package com.opticrm.finance.dto;

import com.opticrm.finance.entity.SalesOrder;
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
public class SalesOrderDto {

    private UUID id;
    private String orderNumber;
    private UUID quoteId;
    private AccountSummaryDto account;
    private UUID contactId;
    private SalesOrder.OrderStatus status;
    private LocalDate orderDate;
    private LocalDate expectedDeliveryDate;
    private List<SalesOrderLineDto> lines;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal total;
    private String currency;
    private String shippingStreet;
    private String shippingCity;
    private String shippingState;
    private String shippingPostalCode;
    private String shippingCountry;
    private String notes;
    private UserSummaryDto assignedTo;
    private UserSummaryDto createdBy;
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
