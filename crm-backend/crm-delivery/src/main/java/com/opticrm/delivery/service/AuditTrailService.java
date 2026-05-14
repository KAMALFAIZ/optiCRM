package com.opticrm.delivery.service;

import com.opticrm.delivery.entity.AuditTrail;
import com.opticrm.delivery.repository.AuditTrailRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class AuditTrailService {

    private final AuditTrailRepository auditTrailRepository;

    public void logAction(String action, String entityType, UUID entityId, UUID userId, String whatChanged) {
        log.debug("Logging audit: {} on {} with id {}", action, entityType, entityId);

        AuditTrail trail = AuditTrail.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .whoUserId(userId)
                .whatChanged(whatChanged)
                .whenDate(LocalDateTime.now())
                .build();

        auditTrailRepository.save(trail);
    }

    public void logActionWithLocation(String action, String entityType, UUID entityId, UUID userId,
                                     String whatChanged, String whereLocation, String whyReason) {
        log.debug("Logging audit with location: {} on {} at {}", action, entityType, whereLocation);

        AuditTrail trail = AuditTrail.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .whoUserId(userId)
                .whatChanged(whatChanged)
                .whenDate(LocalDateTime.now())
                .whereLocation(whereLocation)
                .whyReason(whyReason)
                .build();

        auditTrailRepository.save(trail);
    }

    public List<AuditTrail> getHistory(String entityType, UUID entityId) {
        return auditTrailRepository.findByEntityTypeAndEntityId(entityType, entityId);
    }

    public List<AuditTrail> getHistoryByDateRange(LocalDateTime from, LocalDateTime to) {
        return auditTrailRepository.findByWhenDateBetween(from, to);
    }
}
