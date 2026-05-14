package com.opticrm.tenant.repository;

import com.opticrm.tenant.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    Optional<Tenant> findBySlug(String slug);
    Optional<Tenant> findByCustomDomain(String customDomain);
    boolean existsBySlug(String slug);

    /** Charge tous les tenants avec leur plan en une seule requête (évite le lazy loading). */
    @Query("SELECT t FROM Tenant t LEFT JOIN FETCH t.plan ORDER BY t.createdAt DESC")
    List<Tenant> findAllWithPlan();

    @Query("SELECT t FROM Tenant t LEFT JOIN FETCH t.plan WHERE t.id = :id")
    Optional<Tenant> findByIdWithPlan(UUID id);
}
