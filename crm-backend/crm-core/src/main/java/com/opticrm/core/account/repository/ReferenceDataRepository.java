package com.opticrm.core.account.repository;

import com.opticrm.core.account.entity.ReferenceData;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReferenceDataRepository extends JpaRepository<ReferenceData, UUID> {

    List<ReferenceData> findByCategoryOrderBySortOrder(String category);

    List<ReferenceData> findByCategoryAndActiveOrderBySortOrder(String category, boolean active);

    List<ReferenceData> findAllByOrderByCategoryAscSortOrderAsc();

    boolean existsByCategoryAndValue(String category, String value);
}
