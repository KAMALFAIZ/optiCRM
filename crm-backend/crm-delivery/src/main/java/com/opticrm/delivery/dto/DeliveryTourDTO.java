package com.opticrm.delivery.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryTourDTO {
    private UUID id;
    private LocalDate tourDate;
    private UUID representativeId;
    private UUID vehicleId;
    private String zone;
    private String status;
    private List<DeliveryLineDTO> deliveryLines;
    private List<VehicleLoadDTO> vehicleLoads;
    private List<ReturnEntryDTO> returnEntries;
}
