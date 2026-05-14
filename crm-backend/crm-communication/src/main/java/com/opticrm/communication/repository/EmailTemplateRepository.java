package com.opticrm.communication.repository;

import com.opticrm.communication.entity.EmailTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, UUID> {

    @Query("SELECT t FROM EmailTemplate t WHERE " +
            "LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(t.subject) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(t.category) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<EmailTemplate> search(@Param("search") String search, Pageable pageable);

    Page<EmailTemplate> findByCategory(String category, Pageable pageable);

    Page<EmailTemplate> findByIsActive(Boolean isActive, Pageable pageable);

    @Query("SELECT COUNT(t) FROM EmailTemplate t WHERE t.category = :category")
    long countByCategory(@Param("category") String category);
}
