package com.opticrm.workflow.repository;

import com.opticrm.workflow.entity.WorkflowExecution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowExecutionRepository extends JpaRepository<WorkflowExecution, UUID> {

    Page<WorkflowExecution> findByWorkflowIdOrderByStartedAtDesc(UUID workflowId, Pageable pageable);

    @Query("""
        SELECT e FROM WorkflowExecution e
        WHERE (:workflowId IS NULL OR e.workflow.id = :workflowId)
        AND (:status IS NULL OR e.status = :status)
        AND (:entityType IS NULL OR e.entityType = :entityType)
        ORDER BY e.startedAt DESC
    """)
    Page<WorkflowExecution> findAllWithFilters(
            @Param("workflowId") UUID workflowId,
            @Param("status") String status,
            @Param("entityType") String entityType,
            Pageable pageable
    );

    List<WorkflowExecution> findByStatusAndResumeAtBefore(String status, Instant now);

    long countByWorkflowId(UUID workflowId);

    long countByWorkflowIdAndStatus(UUID workflowId, String status);

    @Query("SELECT e FROM WorkflowExecution e WHERE e.status = 'PAUSED' AND e.resumeAt <= :now")
    List<WorkflowExecution> findPausedExecutionsReadyToResume(@Param("now") Instant now);
}
