package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.RepObjective;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RepObjectiveRepository extends JpaRepository<RepObjective, UUID> {
    List<RepObjective> findByRepresentativeId(UUID representativeId);
    Optional<RepObjective> findByRepresentativeIdAndYearAndMonth(UUID representativeId, int year, int month);
    List<RepObjective> findByYearAndMonth(int year, int month);
    List<RepObjective> findByYear(int year);
}
