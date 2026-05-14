package com.opticrm.workflow.repository;

import com.opticrm.workflow.entity.WorkflowTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface WorkflowTemplateRepository extends JpaRepository<WorkflowTemplate, UUID> {

    /**
     * Recherche paginée avec filtres optionnels sur catégorie, entityType et recherche textuelle.
     */
    @Query("""
            SELECT t FROM WorkflowTemplate t
            WHERE (:search IS NULL OR
                   LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(t.tags) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:category IS NULL OR t.category = :category)
              AND (:entityType IS NULL OR t.entityType = :entityType)
            """)
    Page<WorkflowTemplate> findAllWithFilters(
            @Param("search")     String search,
            @Param("category")   String category,
            @Param("entityType") String entityType,
            Pageable pageable
    );

    /** Incrémente le compteur d'utilisation après création d'un workflow depuis ce template. */
    @Modifying
    @Query("UPDATE WorkflowTemplate t SET t.usageCount = t.usageCount + 1 WHERE t.id = :id")
    void incrementUsageCount(@Param("id") UUID id);
}
