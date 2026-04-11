package com.opticrm.core.sav.repository;

import com.opticrm.core.sav.entity.SavAuthClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavAuthClientRepository extends JpaRepository<SavAuthClient, UUID> {
    Optional<SavAuthClient> findByTelWhatsapp(String telWhatsapp);
    Optional<SavAuthClient> findBySessionToken(String sessionToken);
}
