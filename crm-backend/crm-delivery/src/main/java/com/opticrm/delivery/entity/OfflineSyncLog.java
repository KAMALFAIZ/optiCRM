package com.opticrm.delivery.entity;

import com.opticrm.common.util.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "offline_sync_log")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class OfflineSyncLog extends BaseEntity {

    @Column(name = "device_id", length = 100)
    private String deviceId;

    @Column(name = "representative_id")
    private UUID representativeId;

    @Column(name = "action_type", nullable = false, length = 100)
    private String actionType;

    @Column(name = "payload", columnDefinition = "NVARCHAR(MAX)")
    private String payload;

    @Enumerated(EnumType.STRING)
    @Column(name = "sync_status", nullable = false)
    private SyncStatus syncStatus = SyncStatus.SYNCED;

    @Column(name = "synced_at")
    private LocalDateTime syncedAt;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    public enum SyncStatus {
        SYNCED, FAILED, PARTIAL
    }
}
