package com.opticrm.core.opportunity.repository;

import com.opticrm.core.opportunity.entity.OpportunityStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OpportunityStageRepository extends JpaRepository<OpportunityStage, UUID> {

    Optional<OpportunityStage> findByCode(String code);

    @Query("SELECT s FROM OpportunityStage s ORDER BY s.sortOrder ASC")
    List<OpportunityStage> findAllOrdered();

    @Query("SELECT s FROM OpportunityStage s WHERE s.isClosed = false ORDER BY s.sortOrder ASC")
    List<OpportunityStage> findOpenStages();

    @Query("SELECT s FROM OpportunityStage s WHERE s.isClosed = true AND s.isWon = true")
    Optional<OpportunityStage> findWonStage();

    @Query("SELECT s FROM OpportunityStage s WHERE s.isClosed = true AND s.isWon = false")
    Optional<OpportunityStage> findLostStage();
}
