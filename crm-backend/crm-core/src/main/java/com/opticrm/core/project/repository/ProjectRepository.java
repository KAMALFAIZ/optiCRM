package com.opticrm.core.project.repository;

import com.opticrm.core.project.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    @Query("SELECT p FROM Project p WHERE " +
            "(:status IS NULL OR p.status = :status) AND " +
            "(:accountId IS NULL OR p.account.id = :accountId) AND " +
            "(:managerId IS NULL OR p.manager.id = :managerId)")
    Page<Project> findWithFilters(
            @Param("status") Project.ProjectStatus status,
            @Param("accountId") UUID accountId,
            @Param("managerId") UUID managerId,
            Pageable pageable);

    @Query("SELECT p FROM Project p WHERE " +
            "LOWER(p.reference) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<Project> search(@Param("q") String q, Pageable pageable);

    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(reference, 5, LEN(reference)) AS INTEGER)), 0) " +
            "FROM projects WHERE reference LIKE 'PRJ-%'", nativeQuery = true)
    Integer findMaxProjectNumber();
}
