package com.opticrm.core.chantier.repository;

import com.opticrm.core.chantier.entity.Chantier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChantierRepository extends JpaRepository<Chantier, UUID> {

    Page<Chantier> findByAccountId(UUID accountId, Pageable pageable);

    List<Chantier> findByAccountId(UUID accountId);

    Page<Chantier> findByAssignedToId(UUID assignedToId, Pageable pageable);

    Page<Chantier> findByStadeChantier(String stadeChantier, Pageable pageable);

    Page<Chantier> findByStatutChantier(String statutChantier, Pageable pageable);

    Page<Chantier> findByTypeProjet(String typeProjet, Pageable pageable);

    Page<Chantier> findByTemoin(boolean temoin, Pageable pageable);

    Page<Chantier> findByPrefecture(String prefecture, Pageable pageable);

    @Query("""
        SELECT c FROM Chantier c
        WHERE LOWER(c.nom) LIKE LOWER(CONCAT('%', :search, '%'))
           OR LOWER(c.ville) LIKE LOWER(CONCAT('%', :search, '%'))
           OR LOWER(c.prefecture) LIKE LOWER(CONCAT('%', :search, '%'))
    """)
    Page<Chantier> search(@Param("search") String search, Pageable pageable);

    // Pour la carte interactive : tous les chantiers avec GPS
    @Query("SELECT c FROM Chantier c WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL")
    List<Chantier> findAllWithGps();

    @Query("SELECT COUNT(c) FROM Chantier c GROUP BY c.stadeChantier")
    List<Object[]> countByStadeGrouped();
}
