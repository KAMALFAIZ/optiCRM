package com.opticrm.core.objection.repository;

import com.opticrm.core.objection.entity.Objection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ObjectionRepository extends JpaRepository<Objection, UUID> {

    Optional<Objection> findByCode(String code);

    boolean existsByCode(String code);

    Page<Objection> findByContactId(UUID contactId, Pageable pageable);

    Page<Objection> findByAccountId(UUID accountId, Pageable pageable);

    Page<Objection> findByOpportunityId(UUID opportunityId, Pageable pageable);

    Page<Objection> findByAssignedToId(UUID userId, Pageable pageable);

    @Query("SELECT o FROM Objection o WHERE " +
            "(:status IS NULL OR o.status = :status) AND " +
            "(:category IS NULL OR o.category = :category) AND " +
            "(:priority IS NULL OR o.priority = :priority) AND " +
            "(:assignedToId IS NULL OR o.assignedTo.id = :assignedToId) AND " +
            "(:accountId IS NULL OR o.account.id = :accountId)")
    Page<Objection> findWithFilters(
            @Param("status") Objection.ObjectionStatus status,
            @Param("category") Objection.ObjectionCategory category,
            @Param("priority") Objection.ObjectionPriority priority,
            @Param("assignedToId") UUID assignedToId,
            @Param("accountId") UUID accountId,
            Pageable pageable);

    @Query("SELECT o FROM Objection o WHERE " +
            "LOWER(o.code) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(o.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(o.description) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Objection> search(@Param("search") String search, Pageable pageable);

    @Query("SELECT o FROM Objection o WHERE o.status IN ('OPEN', 'IN_PROGRESS')")
    List<Objection> findOpenObjections();

    @Query("SELECT COUNT(o) FROM Objection o WHERE o.status = :status")
    long countByStatus(@Param("status") Objection.ObjectionStatus status);

    @Query("SELECT COUNT(o) FROM Objection o WHERE o.category = :category")
    long countByCategory(@Param("category") Objection.ObjectionCategory category);

    @Query("SELECT o.category, COUNT(o) FROM Objection o GROUP BY o.category")
    List<Object[]> countByCategories();

    @Query("SELECT o.status, COUNT(o) FROM Objection o GROUP BY o.status")
    List<Object[]> countByStatuses();

    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(code, 5, LEN(code)) AS INTEGER)), 0) " +
            "FROM sales_objections WHERE code LIKE 'OBJ-%'", nativeQuery = true)
    Integer findMaxObjectionNumber();
}
