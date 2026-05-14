package com.opticrm.delivery.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleLoadKpiDTO {
    private long sessions;
    private long totalLignes;
    private long totalQte;
    private long confirmees;
    private long enAttente;
}
