package com.opticrm.workflow.repository;

import com.opticrm.workflow.entity.WorkflowTransition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowTransitionRepository extends JpaRepository<WorkflowTransition, UUID> {

    List<WorkflowTransition> findByFromStepIdOrderByEvalOrderAsc(UUID fromStepId);

    List<WorkflowTransition> findByWorkflowId(UUID workflowId);
}
