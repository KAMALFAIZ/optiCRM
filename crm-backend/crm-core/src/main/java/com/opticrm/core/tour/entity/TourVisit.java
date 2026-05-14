package com.opticrm.core.tour.entity;

import com.opticrm.core.visit.entity.Visit;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "tour_visits")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IdClass(TourVisit.TourVisitId.class)
public class TourVisit {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tour_id")
    private Tour tour;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visit_id")
    private Visit visit;

    @Column(name = "visit_order", nullable = false)
    private Integer visitOrder;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TourVisitId implements Serializable {
        private UUID tour;
        private UUID visit;
    }
}
