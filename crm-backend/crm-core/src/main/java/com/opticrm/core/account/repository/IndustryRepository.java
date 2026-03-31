package com.opticrm.core.account.repository;

import com.opticrm.core.account.entity.Industry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IndustryRepository extends JpaRepository<Industry, UUID> {

    Optional<Industry> findByCode(String code);

    boolean existsByCode(String code);

    List<Industry> findByParentIndustryIsNull();

    List<Industry> findByParentIndustryId(UUID parentId);
}
