package com.opticrm.core.contact.repository;

import com.opticrm.core.contact.entity.Contact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContactRepository extends JpaRepository<Contact, UUID>, JpaSpecificationExecutor<Contact> {

    Optional<Contact> findByEmail(String email);

    List<Contact> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);

    @Query("SELECT c FROM Contact c WHERE " +
            "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.jobTitle) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Contact> search(@Param("search") String search, Pageable pageable);

    @Query("SELECT c FROM Contact c WHERE c.account.id = :accountId")
    List<Contact> findByAccountId(@Param("accountId") UUID accountId);

    @Query("SELECT c FROM Contact c WHERE c.account.id = :accountId")
    Page<Contact> findByAccountIdPaged(@Param("accountId") UUID accountId, Pageable pageable);

    @Query("SELECT c FROM Contact c WHERE c.assignedTo.id = :userId")
    Page<Contact> findByAssignedToId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT c FROM Contact c WHERE c.reportsTo.id = :managerId")
    List<Contact> findByReportsToId(@Param("managerId") UUID managerId);

    @Query("SELECT c FROM Contact c WHERE c.contactRole = :role AND c.account.id = :accountId")
    List<Contact> findByAccountIdAndRole(@Param("accountId") UUID accountId, @Param("role") String role);

    @Query("SELECT c FROM Contact c WHERE c.doNotCall = false AND c.doNotEmail = false")
    Page<Contact> findContactable(Pageable pageable);

    @Query("SELECT COUNT(c) FROM Contact c WHERE c.account.id = :accountId")
    long countByAccountId(@Param("accountId") UUID accountId);

    @Query("SELECT c FROM Contact c WHERE " +
            "LOWER(c.firstName) = LOWER(:firstName) AND " +
            "LOWER(c.lastName) = LOWER(:lastName) AND " +
            "(c.email = :email OR c.phoneMobile = :phone)")
    List<Contact> findPotentialDuplicates(
            @Param("firstName") String firstName,
            @Param("lastName") String lastName,
            @Param("email") String email,
            @Param("phone") String phone
    );
}
