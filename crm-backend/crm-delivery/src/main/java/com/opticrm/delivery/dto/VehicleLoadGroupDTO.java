package com.opticrm.delivery.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Vue groupée : une ligne par (tournée + dépôt).
 * Affiche le total articles et la quantité globale.
 * Les sessions détaillées restent accessibles via "sessions".
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleLoadGroupDTO {

    // ─── Clé du groupe ────────────────────────────────────────────────────────
    private UUID deliveryTourId;
    private UUID warehouseFromId;

    // ─── Infos tournée ────────────────────────────────────────────────────────
    private LocalDate tourDate;
    private String zone;
    private UUID representativeId;
    private UUID vehicleId;

    // ─── Agrégats du groupe ───────────────────────────────────────────────────
    private int nbSessions;        // nombre de sessions dans le groupe
    private int nbArticles;        // nombre de lignes articles distincts
    private int totalQuantite;     // somme des quantités
    private LocalDateTime lastLoadDate; // date du dernier chargement

    // ─── Statut du groupe ─────────────────────────────────────────────────────
    private String statut;         // LOADED si toutes confirmées, DRAFT sinon

    // ─── Détail des sessions ──────────────────────────────────────────────────
    private List<VehicleLoadDTO> sessions;
}
