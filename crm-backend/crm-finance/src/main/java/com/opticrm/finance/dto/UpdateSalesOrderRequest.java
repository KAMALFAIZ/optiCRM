package com.opticrm.finance.dto;

import com.opticrm.finance.entity.SalesOrder;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSalesOrderRequest {

    private SalesOrder.OrderStatus status;
    private UUID contactId;
    private LocalDate orderDate;
    private LocalDate expectedDeliveryDate;

    /** If provided, replaces all existing lines. */
    private List<CreateSalesOrderRequest.LineRequest> lines;

    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal total;

    @Size(max = 3, message = "La devise ne doit pas dépasser 3 caractères")
    private String currency;

    private String shippingStreet;
    private String shippingCity;
    private String shippingState;
    private String shippingPostalCode;
    private String shippingCountry;
    private String notes;
    private UUID assignedToId;
}
