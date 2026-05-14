package com.opticrm.delivery.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleLoadDTO {

    // ─── Session (entête) ─────────────────────────────────────────────────────
    private UUID id;
    private UUID deliveryTourId;
    private UUID existingSessionId; // si fourni : ajoute les items à cette session au lieu d'en créer une nouvelle

    // Champs tournée pour l'affichage liste
    private LocalDate tourDate;
    private String zone;
    private UUID representativeId;
    private UUID vehicleId;

    // Session de chargement
    private LocalDateTime loadDate;
    private UUID warehouseFromId;
    private String status;

    // ─── Lignes articles (détail) ─────────────────────────────────────────────
    private List<VehicleLoadItemDTO> items;

    // ─── DTO article ──────────────────────────────────────────────────────────
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehicleLoadItemDTO {
        private UUID id;
        private UUID itemId;
        private Integer quantity;
        private UUID batchId;
        private String lotNumber;
        private LocalDate expiryDate;
    }
}
