package com.opticrm.core.chantier.repository;

import com.opticrm.core.chantier.entity.ChantierEchantillon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChantierEchantillonRepository extends JpaRepository<ChantierEchantillon, UUID> {
    List<ChantierEchantillon> findByChantierIdOrderByCreatedAtDesc(UUID chantierId);
}
