package com.opticrm.core.project.repository;

import com.opticrm.core.project.entity.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, UUID> {
    List<Milestone> findByProjectIdOrderBySortOrderAsc(UUID projectId);
    int countByProjectId(UUID projectId);
}
