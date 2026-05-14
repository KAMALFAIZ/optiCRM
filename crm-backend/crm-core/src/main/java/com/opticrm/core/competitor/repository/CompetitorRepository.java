package com.opticrm.core.competitor.repository;

import com.opticrm.core.competitor.entity.Competitor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CompetitorRepository extends JpaRepository<Competitor, UUID> {

    @Query("SELECT c FROM Competitor c WHERE " +
           "(COALESCE(:search, '') = '' OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(c.website) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY c.name ASC")
    Page<Competitor> search(@Param("search") String search, Pageable pageable);

    List<Competitor> findByIsActiveTrue();
}
