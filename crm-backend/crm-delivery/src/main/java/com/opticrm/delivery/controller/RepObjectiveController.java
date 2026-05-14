package com.opticrm.delivery.controller;

import com.opticrm.delivery.dto.RepObjectiveDTO;
import com.opticrm.delivery.service.RepObjectiveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/delivery/objective")
@RequiredArgsConstructor
public class RepObjectiveController {

    private final RepObjectiveService objectiveService;

    /** Créer ou mettre à jour un objectif (upsert par repId+year+month) */
    @PostMapping
    public ResponseEntity<RepObjectiveDTO> upsert(@RequestBody RepObjectiveDTO dto) {
        return ResponseEntity.ok(toDto(objectiveService.upsert(dto)));
    }

    /** Tous les objectifs d'un mois donné */
    @GetMapping
    public ResponseEntity<List<RepObjectiveDTO>> getByYearMonth(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(objectiveService.getByYearMonth(year, month));
    }

    /** Tous les objectifs d'un représentant */
    @GetMapping("/rep/{repId}")
    public ResponseEntity<List<RepObjectiveDTO>> getByRep(@PathVariable UUID repId) {
        return ResponseEntity.ok(objectiveService.getByRep(repId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        objectiveService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private RepObjectiveDTO toDto(com.opticrm.delivery.entity.RepObjective o) {
        return RepObjectiveDTO.builder()
            .id(o.getId())
            .representativeId(o.getRepresentativeId())
            .year(o.getYear())
            .month(o.getMonth())
            .revenueTarget(o.getRevenueTarget())
            .visitTarget(o.getVisitTarget())
            .deliveryTarget(o.getDeliveryTarget())
            .notes(o.getNotes())
            .build();
    }
}
