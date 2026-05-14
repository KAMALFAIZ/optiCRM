package com.opticrm.core.opportunity.repository;

import com.opticrm.core.opportunity.entity.Opportunity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface OpportunityRepository extends JpaRepository<Opportunity, UUID> {

    @Query("""
        SELECT o FROM Opportunity o
        WHERE (COALESCE(:search, '') = '' OR
            LOWER(o.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(o.account.name) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:stageId IS NULL OR o.stage.id = :stageId)
        AND (:accountId IS NULL OR o.account.id = :accountId)
        AND (:assignedToId IS NULL OR o.assignedTo.id = :assignedToId)
        AND (:isClosed IS NULL OR o.isClosed = :isClosed)
    """)
    Page<Opportunity> findAllWithFilters(
            @Param("search") String search,
            @Param("stageId") UUID stageId,
            @Param("accountId") UUID accountId,
            @Param("assignedToId") UUID assignedToId,
            @Param("isClosed") Boolean isClosed,
            Pageable pageable
    );

    List<Opportunity> findByAccountId(UUID accountId);

    List<Opportunity> findByAssignedToId(UUID assignedToId);

    @Query("SELECT o FROM Opportunity o WHERE o.stage.id = :stageId")
    List<Opportunity> findByStageId(@Param("stageId") UUID stageId);

    @Query("SELECT COUNT(o) FROM Opportunity o WHERE o.stage.id = :stageId")
    long countByStageId(@Param("stageId") UUID stageId);

    @Query("SELECT SUM(o.amount) FROM Opportunity o WHERE o.isClosed = false")
    BigDecimal sumOpenAmount();

    @Query("SELECT SUM(o.weightedAmount) FROM Opportunity o WHERE o.isClosed = false")
    BigDecimal sumWeightedAmount();

    @Query("SELECT COUNT(o) FROM Opportunity o WHERE o.isWon = true")
    long countWon();

    @Query("SELECT COUNT(o) FROM Opportunity o WHERE o.isClosed = true AND o.isWon = false")
    long countLost();

    @Query("""
        SELECT o FROM Opportunity o
        WHERE o.isClosed = false
        AND o.closeDate <= CURRENT_DATE
        ORDER BY o.closeDate ASC
    """)
    List<Opportunity> findOverdueOpportunities();

    // ---- Pipeline Kanban ----

    /**
     * Charge toutes les opportunités ouvertes pour le Kanban.
     * JOIN FETCH pour éviter les N+1 sur stage, account et assignedTo.
     */
    @Query("""
        SELECT o FROM Opportunity o
        JOIN FETCH o.stage
        JOIN FETCH o.account
        LEFT JOIN FETCH o.assignedTo
        LEFT JOIN FETCH o.primaryContact
        WHERE o.isClosed = false
        AND (:assignedToId IS NULL OR o.assignedTo.id = :assignedToId)
        ORDER BY COALESCE(o.amount, 0) DESC, o.createdAt DESC
    """)
    List<Opportunity> findOpenOpportunitiesForPipeline(@Param("assignedToId") UUID assignedToId);

    // Account-specific stats
    long countByAccountId(UUID accountId);

    @Query("SELECT COUNT(o) FROM Opportunity o WHERE o.account.id = :accountId AND o.isClosed = false")
    long countOpenByAccountId(@Param("accountId") UUID accountId);

    @Query("SELECT COUNT(o) FROM Opportunity o WHERE o.account.id = :accountId AND o.isWon = true")
    long countWonByAccountId(@Param("accountId") UUID accountId);

    @Query("SELECT COALESCE(SUM(o.amount), 0) FROM Opportunity o WHERE o.account.id = :accountId AND o.isWon = true")
    BigDecimal sumWonAmountByAccountId(@Param("accountId") UUID accountId);

    @Query("SELECT COALESCE(SUM(o.amount), 0) FROM Opportunity o WHERE o.account.id = :accountId AND o.isClosed = false")
    BigDecimal sumOpenPipelineByAccountId(@Param("accountId") UUID accountId);
}
