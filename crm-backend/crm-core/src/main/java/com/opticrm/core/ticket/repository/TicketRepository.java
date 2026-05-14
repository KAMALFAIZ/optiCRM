package com.opticrm.core.ticket.repository;

import com.opticrm.core.ticket.entity.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    @Query("SELECT t FROM Ticket t WHERE " +
            "(:status IS NULL OR t.status = :status) AND " +
            "(:category IS NULL OR t.category = :category) AND " +
            "(:priority IS NULL OR t.priority = :priority) AND " +
            "(:accountId IS NULL OR t.account.id = :accountId) AND " +
            "(:assignedToId IS NULL OR t.assignedTo.id = :assignedToId)")
    Page<Ticket> findWithFilters(
            @Param("status") Ticket.TicketStatus status,
            @Param("category") Ticket.TicketCategory category,
            @Param("priority") Ticket.TicketPriority priority,
            @Param("accountId") UUID accountId,
            @Param("assignedToId") UUID assignedToId,
            Pageable pageable);

    @Query("SELECT t FROM Ticket t WHERE " +
            "LOWER(t.reference) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(t.title) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(t.description) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<Ticket> search(@Param("q") String q, Pageable pageable);

    Page<Ticket> findByAccountId(UUID accountId, Pageable pageable);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status = :status")
    long countByStatus(@Param("status") Ticket.TicketStatus status);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.priority = :priority")
    long countByPriority(@Param("priority") Ticket.TicketPriority priority);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.slaDeadline < :now AND t.status NOT IN :statuses")
    long countSlaBreached(@Param("now") Instant now, @Param("statuses") Collection<Ticket.TicketStatus> statuses);

    @Query("SELECT t.category, COUNT(t) FROM Ticket t GROUP BY t.category")
    List<Object[]> countByCategories();

    @Query("SELECT t.priority, COUNT(t) FROM Ticket t GROUP BY t.priority")
    List<Object[]> countByPriorities();

    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(reference, 5, LEN(reference)) AS INTEGER)), 0) " +
            "FROM tickets WHERE reference LIKE 'TKT-%'", nativeQuery = true)
    Integer findMaxTicketNumber();
}
