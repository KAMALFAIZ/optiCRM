package com.opticrm.core.lead.repository;

import com.opticrm.core.lead.entity.Lead;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LeadRepository extends JpaRepository<Lead, UUID> {

    @Query("""
        SELECT l FROM Lead l
        WHERE l.isConverted = false
        AND (COALESCE(:search, '') = '' OR
            LOWER(l.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(l.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(l.email) LIKE LOWER(CONCAT('%', :search, '%')) OR
            LOWER(l.companyName) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (COALESCE(:status, '') = '' OR l.status = :status)
        AND (COALESCE(:source, '') = '' OR l.source = :source)
        AND (:assignedToId IS NULL OR l.assignedTo.id = :assignedToId)
    """)
    Page<Lead> findAllWithFilters(
            @Param("search") String search,
            @Param("status") String status,
            @Param("source") String source,
            @Param("assignedToId") UUID assignedToId,
            Pageable pageable
    );

    List<Lead> findByAssignedToId(UUID assignedToId);

    List<Lead> findByStatus(String status);

    @Query("SELECT COUNT(l) FROM Lead l WHERE l.status = :status AND l.isConverted = false")
    long countByStatus(@Param("status") String status);

    @Query("SELECT l FROM Lead l WHERE l.email = :email AND l.isConverted = false")
    List<Lead> findByEmail(@Param("email") String email);

    @Query("""
        SELECT l FROM Lead l
        WHERE l.isConverted = false
        AND (LOWER(l.firstName) LIKE LOWER(CONCAT('%', :firstName, '%'))
             AND LOWER(l.lastName) LIKE LOWER(CONCAT('%', :lastName, '%')))
        OR (l.email IS NOT NULL AND l.email = :email)
        OR (l.phone IS NOT NULL AND l.phone = :phone)
    """)
    List<Lead> findDuplicates(
            @Param("firstName") String firstName,
            @Param("lastName") String lastName,
            @Param("email") String email,
            @Param("phone") String phone
    );

    long countByCampaignId(UUID campaignId);

    List<Lead> findByCampaignId(UUID campaignId);

    @Query("SELECT l.source, COUNT(l) FROM Lead l WHERE l.isConverted = false GROUP BY l.source")
    List<Object[]> countBySourceGrouped();

    @Query("SELECT COUNT(l) FROM Lead l WHERE l.isConverted = false")
    long countActive();

    @Query("SELECT COUNT(l) FROM Lead l WHERE l.isConverted = true")
    long countConverted();
}
