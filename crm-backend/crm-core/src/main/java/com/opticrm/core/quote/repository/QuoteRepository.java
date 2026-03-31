package com.opticrm.core.quote.repository;

import com.opticrm.core.quote.entity.Quote;
import com.opticrm.core.quote.entity.Quote.QuoteStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuoteRepository extends JpaRepository<Quote, UUID> {

    Optional<Quote> findByQuoteNumber(String quoteNumber);

    List<Quote> findByAccountId(UUID accountId);

    List<Quote> findByOpportunityId(UUID opportunityId);

    List<Quote> findByAssignedToId(UUID userId);

    List<Quote> findByChantierIdOrderByCreatedAtDesc(UUID chantierId);

    @Query("""
        SELECT q FROM Quote q
        LEFT JOIN q.account a
        LEFT JOIN q.contact c
        LEFT JOIN q.assignedTo u
        WHERE (COALESCE(:search, '') = '' OR LOWER(q.quoteNumber) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:status IS NULL OR q.status = :status)
        AND (:accountId IS NULL OR a.id = :accountId)
        AND (:assignedToId IS NULL OR u.id = :assignedToId)
    """)
    Page<Quote> findAllWithFilters(
            @Param("search") String search,
            @Param("status") QuoteStatus status,
            @Param("accountId") UUID accountId,
            @Param("assignedToId") UUID assignedToId,
            Pageable pageable
    );

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(q.quoteNumber, 8) AS integer)), 0) FROM Quote q WHERE q.quoteNumber LIKE CONCAT(:prefix, '%')")
    Integer findMaxQuoteNumberByPrefix(@Param("prefix") String prefix);

    @Query("SELECT COUNT(q) FROM Quote q WHERE q.status = :status")
    long countByStatus(@Param("status") QuoteStatus status);
}
