package com.opticrm.core.tour.repository;

import com.opticrm.core.tour.entity.Tour;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TourRepository extends JpaRepository<Tour, UUID>, JpaSpecificationExecutor<Tour> {

    @Query("SELECT t FROM Tour t WHERE " +
            "LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(t.region) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Tour> search(@Param("search") String search, Pageable pageable);

    Page<Tour> findByStatus(String status, Pageable pageable);

    Page<Tour> findByAssignedToId(UUID assignedToId, Pageable pageable);

    @Query("SELECT t FROM Tour t WHERE t.tourDate >= :from AND t.tourDate <= :to")
    List<Tour> findByDateRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COUNT(t) FROM Tour t WHERE t.status = :status")
    long countByStatus(@Param("status") String status);
}
