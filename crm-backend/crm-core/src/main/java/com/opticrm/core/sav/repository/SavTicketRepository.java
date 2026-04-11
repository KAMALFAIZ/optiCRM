package com.opticrm.core.sav.repository;

import com.opticrm.core.sav.entity.SavTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavTicketRepository extends JpaRepository<SavTicket, UUID> {

    Optional<SavTicket> findByNumeroTicket(String numeroTicket);

    List<SavTicket> findByAccountIdOrderByCreatedAtDesc(UUID accountId);

    List<SavTicket> findByStatutOrderByCreatedAtDesc(String statut);

    List<SavTicket> findByStatutInOrderByCriticiteAscCreatedAtDesc(List<String> statuts);

    @Query("SELECT t FROM SavTicket t WHERE t.statut NOT IN ('FERME', 'ANNULE') " +
           "AND t.slaEcheance < :now ORDER BY t.criticite ASC")
    List<SavTicket> findSlaBreached(@Param("now") Instant now);

    @Query("SELECT COUNT(t) FROM SavTicket t WHERE t.statut = :statut AND t.criticite = :criticite")
    long countByStatutAndCriticite(@Param("statut") String statut, @Param("criticite") String criticite);

    @Query("SELECT COUNT(t) FROM SavTicket t WHERE t.resoluPar = 'IA' " +
           "AND t.createdAt >= :depuis AND t.statut IN ('RESOLU', 'FERME')")
    long countResoluParIa(@Param("depuis") Instant depuis);

    @Query("SELECT COUNT(t) FROM SavTicket t WHERE t.createdAt >= :depuis " +
           "AND t.statut IN ('RESOLU', 'FERME')")
    long countResolusDepuis(@Param("depuis") Instant depuis);

    @Query("SELECT t.domaine, COUNT(t) FROM SavTicket t " +
           "WHERE t.createdAt >= :depuis GROUP BY t.domaine ORDER BY COUNT(t) DESC")
    List<Object[]> countByDomaineDepuis(@Param("depuis") Instant depuis);

    @Query("SELECT MAX(CAST(SUBSTRING(t.numeroTicket, 9, 4) AS integer)) FROM SavTicket t " +
           "WHERE t.numeroTicket LIKE CONCAT('TK-', :annee, '-%')")
    Optional<Integer> findMaxSequenceForYear(@Param("annee") String annee);
}
