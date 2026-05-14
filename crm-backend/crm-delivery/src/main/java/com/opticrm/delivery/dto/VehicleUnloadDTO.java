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
public class VehicleUnloadDTO {

    private UUID id;
    private UUID deliveryTourId;
    private LocalDateTime unloadDate;
    private String status;
    private String notes;
    private UUID confirmedBy;
    private LocalDateTime confirmedAt;
    private List<VehicleUnloadItemDTO> items;

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class VehicleUnloadItemDTO {
        private UUID id;
        private UUID itemId;
        private Integer quantityLoaded;
        private Integer quantitySold;
        private Integer quantityReturned;
        private Integer quantityUnloaded;
    }
}
