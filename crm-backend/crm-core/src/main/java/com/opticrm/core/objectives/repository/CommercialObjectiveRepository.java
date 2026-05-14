package com.opticrm.core.objectives.repository;

import com.opticrm.core.objectives.entity.CommercialObjective;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CommercialObjectiveRepository extends JpaRepository<CommercialObjective, UUID> {

    @Query(value = "SELECT * FROM commercial_objectives WHERE period_year = :year " +
           "AND (:month IS NULL OR period_month = :month) " +
           "AND (:userId IS NULL OR user_id = :userId)",
           nativeQuery = true)
    List<CommercialObjective> findFiltered(
            @Param("year") int year,
            @Param("month") Integer month,
            @Param("userId") UUID userId);

    Optional<CommercialObjective> findByUserIdAndProductIdAndPeriodYearAndPeriodMonth(
            UUID userId, UUID productId, int year, Integer month);

    void deleteByUserIdAndPeriodYearAndPeriodMonth(UUID userId, int year, Integer month);
}
