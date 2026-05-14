package com.opticrm.api.integration.repository;

import com.opticrm.api.integration.entity.FieldMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface FieldMappingRepository extends JpaRepository<FieldMapping, UUID> {

    List<FieldMapping> findAllByOrderByChampSource();

    List<FieldMapping> findAllByEntityTypeOrderByChampSource(String entityType);

    @Modifying
    @Transactional
    @Query("DELETE FROM FieldMapping m")
    void deleteAllMappings();

    @Modifying
    @Transactional
    @Query("DELETE FROM FieldMapping m WHERE m.entityType = :entityType")
    void deleteAllMappingsByEntityType(String entityType);
}
