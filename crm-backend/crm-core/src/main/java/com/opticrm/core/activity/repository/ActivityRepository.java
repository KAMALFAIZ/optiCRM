package com.opticrm.core.activity.repository;

import com.opticrm.core.activity.entity.Activity;
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
public interface ActivityRepository extends JpaRepository<Activity, UUID>, JpaSpecificationExecutor<Activity> {

    @Query("SELECT a FROM Activity a WHERE " +
            "LOWER(a.subject) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(a.description) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Activity> search(@Param("search") String search, Pageable pageable);

    Page<Activity> findByAssignedToId(UUID assignedToId, Pageable pageable);

    Page<Activity> findByStatus(String status, Pageable pageable);

    Page<Activity> findByActivityType(String activityType, Pageable pageable);

    @Query("SELECT a FROM Activity a WHERE a.startDate >= :from AND a.startDate <= :to")
    List<Activity> findByDateRange(@Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT a FROM Activity a WHERE a.assignedTo.id = :assignedToId AND a.startDate >= :from AND a.startDate <= :to")
    List<Activity> findByAssignedToAndDateRange(@Param("assignedToId") UUID assignedToId,
                                                 @Param("from") Instant from,
                                                 @Param("to") Instant to);

    @Query("SELECT COUNT(a) FROM Activity a WHERE a.status = :status")
    long countByStatus(@Param("status") String status);

    @Query("SELECT COUNT(a) FROM Activity a WHERE a.startDate >= :from AND a.startDate <= :to")
    long countByDateRange(@Param("from") Instant from, @Param("to") Instant to);

    List<Activity> findByRelatedToTypeAndRelatedToId(String relatedToType, UUID relatedToId);
}
