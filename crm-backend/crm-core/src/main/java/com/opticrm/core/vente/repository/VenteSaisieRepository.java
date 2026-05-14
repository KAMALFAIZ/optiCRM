package com.opticrm.core.vente.repository;

import com.opticrm.core.vente.entity.VenteSaisie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface VenteSaisieRepository extends JpaRepository<VenteSaisie, UUID>, JpaSpecificationExecutor<VenteSaisie> {

    @Query("SELECT v FROM VenteSaisie v WHERE v.account.id = :accountId ORDER BY v.dateVente DESC")
    List<VenteSaisie> findByAccountId(@Param("accountId") UUID accountId);

    @Query("SELECT v FROM VenteSaisie v WHERE v.account.id = :accountId ORDER BY v.dateVente DESC")
    Page<VenteSaisie> findByAccountId(@Param("accountId") UUID accountId, Pageable pageable);

    @Query("SELECT v FROM VenteSaisie v WHERE v.dateVente BETWEEN :dateFrom AND :dateTo ORDER BY v.dateVente DESC")
    Page<VenteSaisie> findByDateRange(
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo,
            Pageable pageable);

    @Query("SELECT v FROM VenteSaisie v WHERE v.statut = :statut ORDER BY v.dateVente DESC")
    Page<VenteSaisie> findByStatut(@Param("statut") String statut, Pageable pageable);

    @Query("SELECT SUM(v.montantHt) FROM VenteSaisie v WHERE v.account.id = :accountId AND v.statut = 'CONFIRME'")
    java.math.BigDecimal sumMontantHtByAccountId(@Param("accountId") UUID accountId);
}
