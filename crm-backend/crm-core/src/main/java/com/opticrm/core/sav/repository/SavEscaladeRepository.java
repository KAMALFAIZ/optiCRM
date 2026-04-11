package com.opticrm.core.sav.repository;

import com.opticrm.core.sav.entity.SavEscalade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SavEscaladeRepository extends JpaRepository<SavEscalade, UUID> {
    List<SavEscalade> findByStatutOrderByCreatedAtDesc(String statut);
    List<SavEscalade> findByTicketIdOrderByCreatedAtDesc(UUID ticketId);
}
