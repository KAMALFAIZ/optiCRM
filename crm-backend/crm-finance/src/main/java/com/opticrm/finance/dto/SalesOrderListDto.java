package com.opticrm.finance.dto;

import com.opticrm.finance.entity.SalesOrder;
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
public class SalesOrderListDto {

    private UUID id;
    private String orderNumber;
    private SalesOrder.OrderStatus status;
    private String accountName;
    private UUID accountId;
    private LocalDate orderDate;
    private LocalDate expectedDeliveryDate;
    private BigDecimal total;
    private String currency;
    private String assignedToName;
    private String createdByName;
}
