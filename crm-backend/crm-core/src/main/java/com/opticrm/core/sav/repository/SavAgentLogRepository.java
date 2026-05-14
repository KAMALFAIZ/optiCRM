package com.opticrm.core.sav.repository;

import com.opticrm.core.sav.entity.SavAgentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SavAgentLogRepository extends JpaRepository<SavAgentLog, UUID> {
    List<SavAgentLog> findByTicketIdOrderByDateExecutionAsc(UUID ticketId);
}
