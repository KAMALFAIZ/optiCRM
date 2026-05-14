package com.opticrm.delivery.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReplenishmentDTO {
    private UUID id;
    private String sourceType;
    private UUID sourceId;
    private String targetType;
    private UUID targetId;
    private String motive;
    private LocalDateTime requestDate;
    private String status;
    private UUID approvedBy;
    private LocalDateTime approvalDate;
    private List<StockReplenishmentItemDTO> items;
}
