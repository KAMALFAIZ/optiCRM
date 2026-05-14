package com.opticrm.workflow.repository;

import com.opticrm.workflow.entity.Workflow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, UUID> {

    @Query("""
        SELECT w FROM Workflow w
        WHERE (:search IS NULL OR LOWER(w.name) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:entityType IS NULL OR w.entityType = :entityType)
        AND (:isActive IS NULL OR w.isActive = :isActive)
    """)
    Page<Workflow> findAllWithFilters(
            @Param("search") String search,
            @Param("entityType") String entityType,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );

    List<Workflow> findByEntityTypeAndIsActiveTrue(String entityType);

    List<Workflow> findByTriggerTypeAndIsActiveTrue(String triggerType);

    @Query("SELECT w FROM Workflow w WHERE w.triggerType = 'CRON' AND w.isActive = true")
    List<Workflow> findActiveCronWorkflows();

    long countByIsActiveTrue();
}
