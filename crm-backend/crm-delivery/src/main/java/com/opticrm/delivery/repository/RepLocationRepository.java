package com.opticrm.delivery.repository;

import com.opticrm.delivery.entity.RepLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RepLocationRepository extends JpaRepository<RepLocation, UUID> {
    List<RepLocation> findByDeliveryTourIdOrderByRecordedAtAsc(UUID tourId);
    List<RepLocation> findByRepresentativeIdOrderByRecordedAtDesc(UUID repId);

    /** Dernière position connue de chaque représentant actif */
    @Query("""
        SELECT l FROM RepLocation l
        WHERE l.recordedAt = (
            SELECT MAX(l2.recordedAt) FROM RepLocation l2
            WHERE l2.representativeId = l.representativeId
        )
        """)
    List<RepLocation> findLastKnownPositions();

    Optional<RepLocation> findTopByRepresentativeIdOrderByRecordedAtDesc(UUID repId);
}
