package com.opticrm.core.account.repository;

import com.opticrm.core.account.entity.PricingCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PricingCategoryRepository extends JpaRepository<PricingCategory, UUID> {

    boolean existsByCode(String code);

    List<PricingCategory> findByIsActiveTrueOrderBySortOrderAscNameAsc();

    List<PricingCategory> findAllByOrderBySortOrderAscNameAsc();
}
