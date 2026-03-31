package com.opticrm.security.repository;

import com.opticrm.security.entity.Territory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TerritoryRepository extends JpaRepository<Territory, UUID> {

    List<Territory> findByParentTerritoryIsNull();

    List<Territory> findByParentTerritoryId(UUID parentTerritoryId);

    @Query(value = "SELECT * FROM territories t WHERE t.postal_codes LIKE CONCAT('%', :postalCode, '%')", nativeQuery = true)
    Optional<Territory> findByPostalCode(@Param("postalCode") String postalCode);

    List<Territory> findByCountry(String country);

    List<Territory> findByRegion(String region);

    boolean existsByName(String name);
}
