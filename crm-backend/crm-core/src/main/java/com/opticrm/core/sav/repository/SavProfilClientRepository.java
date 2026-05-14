package com.opticrm.core.sav.repository;

import com.opticrm.core.sav.entity.SavProfilClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavProfilClientRepository extends JpaRepository<SavProfilClient, UUID> {
    Optional<SavProfilClient> findByAccountId(UUID accountId);
}
