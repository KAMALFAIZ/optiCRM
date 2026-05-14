package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.StockReplenishment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface StockReplenishmentRepository extends JpaRepository<StockReplenishment, UUID> {
    List<StockReplenishment> findByStatus(StockReplenishment.ReplenishmentStatus status);
    List<StockReplenishment> findByMotive(StockReplenishment.Motive motive);
    List<StockReplenishment> findBySourceIdAndSourceType(UUID sourceId, StockReplenishment.SourceType sourceType);
    List<StockReplenishment> findByTargetIdAndTargetType(UUID targetId, StockReplenishment.TargetType targetType);
}
