package com.opticrm.delivery.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnEntryDTO {
    private UUID id;
    private UUID deliveryTourId;
    private UUID itemId;
    private Integer quantity;
    private String reason;
    private LocalDateTime receivedDate;
    private UUID warehouseToId;
    private String returnType;
    private UUID deliveryLineId;
    private String status;
}
