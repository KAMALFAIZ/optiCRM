package com.opticrm.core.account.repository;

import com.opticrm.core.account.entity.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID>, JpaSpecificationExecutor<Account> {

    Optional<Account> findBySiret(String siret);

    Optional<Account> findBySiren(String siren);

    Optional<Account> findBySageCode(String sageCode);

    List<Account> findByIce(String ice);

    List<Account> findBySageCodeIn(java.util.Collection<String> sageCodes);

    List<Account> findByNameIgnoreCase(String name);

    boolean existsBySiret(String siret);

    boolean existsBySiren(String siren);

    @Query("SELECT a FROM Account a WHERE " +
            "LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(a.legalName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "a.siret LIKE CONCAT('%', :search, '%') OR " +
            "a.siren LIKE CONCAT('%', :search, '%')")
    Page<Account> search(@Param("search") String search, Pageable pageable);

    Page<Account> findByAccountType(String accountType, Pageable pageable);

    @Query("SELECT a FROM Account a WHERE a.assignedTo.id = :userId")
    Page<Account> findByAssignedToId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT a FROM Account a WHERE a.territory.id = :territoryId")
    Page<Account> findByTerritoryId(@Param("territoryId") UUID territoryId, Pageable pageable);

    @Query("SELECT a FROM Account a WHERE a.industry.id = :industryId")
    List<Account> findByIndustryId(@Param("industryId") UUID industryId);

    Page<Account> findBySageCodeIsNotNull(Pageable pageable);

    Page<Account> findBySocieteAffectation(String societeAffectation, Pageable pageable);

    @Query("SELECT a FROM Account a WHERE a.parentAccount.id = :parentId")
    List<Account> findByParentAccountId(@Param("parentId") UUID parentId);

    @Query("SELECT COUNT(a) FROM Account a WHERE a.accountType = :type")
    long countByAccountType(@Param("type") String type);

    @Query("SELECT a.accountType, COUNT(a) FROM Account a GROUP BY a.accountType")
    List<Object[]> countByAccountTypeGrouped();

    @Modifying
    @Query(value = "DELETE FROM accounts", nativeQuery = true)
    void truncateAllCascade();

    @Query("SELECT a FROM Account a WHERE a.latitude IS NOT NULL AND a.longitude IS NOT NULL ORDER BY a.name ASC")
    List<Account> findAllGeolocated();

    Optional<Account> findByPhone(String phone);
}
