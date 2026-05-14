package com.opticrm.core.campaign.repository;

import com.opticrm.core.campaign.entity.Campaign;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.UUID;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, UUID> {

    @Query("SELECT c FROM Campaign c WHERE " +
            "LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Campaign> search(@Param("search") String search, Pageable pageable);

    @Query("SELECT c FROM Campaign c WHERE " +
            "(COALESCE(:status, '') = '' OR c.status = :status) AND " +
            "(COALESCE(:type, '') = '' OR c.type = :type)")
    Page<Campaign> findWithFilters(
            @Param("status") String status,
            @Param("type") String type,
            Pageable pageable);

    long countByStatus(String status);

    @Query("SELECT COALESCE(SUM(c.budget), 0) FROM Campaign c WHERE c.status != 'cancelled'")
    BigDecimal sumBudget();

    @Query("SELECT COALESCE(SUM(c.actualCost), 0) FROM Campaign c WHERE c.status != 'cancelled'")
    BigDecimal sumActualCost();

    @Query("SELECT COALESCE(SUM(c.expectedRevenue), 0) FROM Campaign c WHERE c.status != 'cancelled'")
    BigDecimal sumExpectedRevenue();
}
