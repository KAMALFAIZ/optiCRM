package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "rep_objective")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RepObjective extends BaseEntity {

    @Column(name = "representative_id", nullable = false)
    private UUID representativeId;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "month", nullable = false)
    private Integer month;

    @Column(name = "revenue_target", precision = 12, scale = 2, nullable = false)
    private BigDecimal revenueTarget = BigDecimal.ZERO;

    @Column(name = "visit_target", nullable = false)
    private Integer visitTarget = 0;

    @Column(name = "delivery_target", nullable = false)
    private Integer deliveryTarget = 0;

    @Column(name = "notes", length = 500)
    private String notes;
}
