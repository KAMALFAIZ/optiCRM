package com.opticrm.api.sage.repository;

import com.opticrm.api.sage.entity.SageSyncRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SageSyncRequestRepository extends JpaRepository<SageSyncRequest, UUID> {

    /** Charge createdBy en même temps pour éviter la LazyInitializationException. */
    @EntityGraph(attributePaths = {"createdBy"})
    Page<SageSyncRequest> findByEntityTypeOrderByCreatedAtDesc(String entityType, Pageable pageable);

    @EntityGraph(attributePaths = {"createdBy"})
    Page<SageSyncRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT r FROM SageSyncRequest r LEFT JOIN FETCH r.createdBy WHERE r.id = :id")
    Optional<SageSyncRequest> findByIdWithCreatedBy(@Param("id") UUID id);
}
