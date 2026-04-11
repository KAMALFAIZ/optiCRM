package com.opticrm.core.sav.repository;

import com.opticrm.core.sav.entity.SavMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SavMessageRepository extends JpaRepository<SavMessage, UUID> {
    List<SavMessage> findByTicketIdOrderByDateEnvoiAsc(UUID ticketId);
}
