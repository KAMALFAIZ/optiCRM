package com.opticrm.core.ticket.dto;

import lombok.*;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketStatsDto {
    private long total;
    private long ouverts;
    private long enCours;
    private long enAttente;
    private long resolus;
    private long fermes;
    private long slaBreached;
    private long critiques;
    private Map<String, Long> parCategorie;
    private Map<String, Long> parPriorite;
}
