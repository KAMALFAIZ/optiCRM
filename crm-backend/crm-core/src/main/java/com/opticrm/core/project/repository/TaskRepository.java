package com.opticrm.core.project.repository;

import com.opticrm.core.project.entity.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    List<Task> findByProjectIdAndParentTaskIsNullOrderByCreatedAtAsc(UUID projectId);

    Page<Task> findByProjectId(UUID projectId, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE " +
            "(:projectId IS NULL OR t.project.id = :projectId) AND " +
            "(:status IS NULL OR t.status = :status) AND " +
            "(:assigneeId IS NULL OR t.assignee.id = :assigneeId)")
    Page<Task> findWithFilters(
            @Param("projectId") UUID projectId,
            @Param("status") Task.TaskStatus status,
            @Param("assigneeId") UUID assigneeId,
            Pageable pageable);

    @Query("SELECT t FROM Task t WHERE t.assignee.id = :userId AND t.status NOT IN :statuses")
    List<Task> findActiveByAssignee(@Param("userId") UUID userId, @Param("statuses") Collection<Task.TaskStatus> statuses);

    int countByProjectId(UUID projectId);

    int countByParentTaskId(UUID parentTaskId);

    int countByProjectIdAndStatus(UUID projectId, Task.TaskStatus status);

    @Query("SELECT t FROM Task t WHERE t.dueDate BETWEEN :from AND :to AND t.status NOT IN :statuses")
    List<Task> findDueBetween(@Param("from") LocalDate from, @Param("to") LocalDate to, @Param("statuses") Collection<Task.TaskStatus> statuses);
}
