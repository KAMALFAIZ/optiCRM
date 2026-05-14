package com.opticrm.api.sage.entity;

import com.opticrm.core.account.entity.Account;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "balance_agee_snapshots")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BalanceAgeeSnapshot {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sync_request_id")
    private SageSyncRequest syncRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(name = "sage_code", nullable = false, length = 50)
    private String sageCode;

    @Column(name = "non_echu", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal nonEchu = BigDecimal.ZERO;

    @Column(name = "echu_1_30", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal echu1a30 = BigDecimal.ZERO;

    @Column(name = "echu_31_60", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal echu31a60 = BigDecimal.ZERO;

    @Column(name = "echu_61_90", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal echu61a90 = BigDecimal.ZERO;

    @Column(name = "echu_91_plus", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal echu91plus = BigDecimal.ZERO;

    @Column(name = "total_du", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalDu = BigDecimal.ZERO;

    @Column(name = "synced_at")
    @Builder.Default
    private Instant syncedAt = Instant.now();
}
