package com.opticrm.core.visit.repository;

import com.opticrm.core.visit.entity.Visit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface VisitRepository extends JpaRepository<Visit, UUID>, JpaSpecificationExecutor<Visit> {

    @Query("SELECT v FROM Visit v WHERE " +
            "LOWER(v.subject) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(v.address) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(v.city) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Visit> search(@Param("search") String search, Pageable pageable);

    Page<Visit> findByStatus(String status, Pageable pageable);

    Page<Visit> findByVisitType(String visitType, Pageable pageable);

    Page<Visit> findByAssignedToId(UUID assignedToId, Pageable pageable);

    @Query("SELECT v FROM Visit v WHERE v.visitDate >= :from AND v.visitDate <= :to")
    List<Visit> findByDateRange(@Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT v FROM Visit v WHERE v.assignedTo.id = :assignedToId AND v.visitDate >= :from AND v.visitDate <= :to")
    List<Visit> findByAssignedToAndDateRange(@Param("assignedToId") UUID assignedToId,
                                              @Param("from") Instant from,
                                              @Param("to") Instant to);

    @Query("SELECT COUNT(v) FROM Visit v WHERE v.status = :status")
    long countByStatus(@Param("status") String status);

    List<Visit> findAllByIdIn(List<UUID> ids);

    List<Visit> findByAccountId(UUID accountId);
}
