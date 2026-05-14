package com.opticrm.core.chantier.repository;

import com.opticrm.core.chantier.entity.ChantierActeur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChantierActeurRepository extends JpaRepository<ChantierActeur, UUID> {

    List<ChantierActeur> findByChantierIdOrderByRoleActeurAsc(UUID chantierId);

    void deleteByChantierIdAndId(UUID chantierId, UUID acteurId);
}
