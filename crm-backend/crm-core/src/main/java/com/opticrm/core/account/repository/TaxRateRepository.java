package com.opticrm.core.account.repository;

import com.opticrm.core.account.entity.TaxRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaxRateRepository extends JpaRepository<TaxRate, UUID> {

    Optional<TaxRate> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT t FROM TaxRate t WHERE t.isDefault = true")
    Optional<TaxRate> findDefault();

    List<TaxRate> findByIsActiveTrue();

    @Query("SELECT t FROM TaxRate t ORDER BY t.rate")
    List<TaxRate> findAllOrdered();
}
