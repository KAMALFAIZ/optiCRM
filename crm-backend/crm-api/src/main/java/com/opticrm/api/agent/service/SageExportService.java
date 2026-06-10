package com.opticrm.api.agent.service;

import com.opticrm.api.agent.dto.ExportResultRequest;
import com.opticrm.api.agent.dto.PendingExportDto;
import com.opticrm.api.agent.entity.SageExportQueue;
import com.opticrm.api.agent.repository.SageExportQueueRepository;
import com.opticrm.tenant.context.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SageExportService {

    private final SageExportQueueRepository repository;

    /** Appelé par les listeners métier pour enfiler un export. */
    @Transactional
    public SageExportQueue enqueue(String entityType, UUID entityId,
                                   Integer sageDocType, String action, String payload,
                                   UUID createdBy) {
        UUID tenantId = TenantContext.get();
        if (tenantId == null) {
            log.warn("Cannot enqueue export — tenant missing | entity={}/{}", entityType, entityId);
            return null;
        }

        // Idempotence : si déjà PENDING/SENT/RETRY pour ce (type,id), ne pas dupliquer
        boolean exists = repository.existsByTenantIdAndEntityTypeAndEntityIdAndStatusIn(
                tenantId, entityType, entityId, List.of("PENDING", "SENT", "RETRY"));
        if (exists) {
            log.debug("Export déjà en file pour {}/{}", entityType, entityId);
            return null;
        }

        SageExportQueue item = SageExportQueue.builder()
                .tenantId(tenantId)
                .entityType(entityType)
                .entityId(entityId)
                .sageDocType(sageDocType)
                .action(action)
                .payload(payload)
                .createdById(createdBy)
                .status("PENDING")
                .build();
        return repository.save(item);
    }

    /** Tirage côté agent : récupère jusqu'à N exports en attente. */
    @Transactional
    public List<PendingExportDto> nextBatch(int limit) {
        UUID tenantId = TenantContext.get();
        var items = repository.findTop50ByTenantIdAndStatusInOrderByCreatedAtAsc(
                tenantId, List.of("PENDING", "RETRY"));

        // Marquer SENT pour éviter doublons si l'agent boucle trop vite
        return items.stream().limit(limit).map(q -> {
            q.setStatus("SENT");
            q.setSentAt(LocalDateTime.now());
            repository.save(q);
            return new PendingExportDto(
                    q.getId(), q.getEntityType(), q.getEntityId(),
                    q.getSageDocType(), q.getAction(), q.getPayload(),
                    q.getRetryCount());
        }).toList();
    }

    /** Confirmation côté agent après écriture (ou échec) dans Sage. */
    @Transactional
    public void completeExport(ExportResultRequest req) {
        UUID tenantId = TenantContext.get();
        SageExportQueue q = repository.findById(req.exportId()).orElse(null);
        if (q == null || !q.getTenantId().equals(tenantId)) {
            log.warn("Export inconnu ou tenant mismatch : {}", req.exportId());
            return;
        }

        switch (req.status()) {
            case "SUCCESS" -> {
                q.setStatus("DONE");
                q.setSagePiece(req.sagePiece());
                q.setCompletedAt(LocalDateTime.now());
                q.setErrorMessage(null);
            }
            case "RETRY" -> {
                q.setStatus("RETRY");
                q.setRetryCount(q.getRetryCount() + 1);
                q.setErrorMessage(req.errorMessage());
                if (q.getRetryCount() >= q.getMaxRetries()) {
                    q.setStatus("ERROR");
                    q.setCompletedAt(LocalDateTime.now());
                }
            }
            default -> {
                q.setStatus("ERROR");
                q.setErrorMessage(req.errorMessage());
                q.setCompletedAt(LocalDateTime.now());
            }
        }
        repository.save(q);
    }
}
