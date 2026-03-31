package com.opticrm.workflow.repository;

import com.opticrm.workflow.entity.WorkflowExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowExecutionLogRepository extends JpaRepository<WorkflowExecutionLog, UUID> {

    List<WorkflowExecutionLog> findByExecutionIdOrderByExecutedAtAsc(UUID executionId);
}
