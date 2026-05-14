package com.opticrm.security.repository;

import com.opticrm.security.entity.SupervisorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupervisorAssignmentRepository extends JpaRepository<SupervisorAssignment, UUID> {

    @Query("SELECT sa FROM SupervisorAssignment sa " +
           "JOIN FETCH sa.collaborator c " +
           "JOIN FETCH c.role " +
           "WHERE sa.supervisor.id = :supervisorId AND sa.isActive = true")
    List<SupervisorAssignment> findActiveBySupervisorId(@Param("supervisorId") UUID supervisorId);

    @Query("SELECT sa FROM SupervisorAssignment sa " +
           "JOIN FETCH sa.supervisor s " +
           "JOIN FETCH s.role " +
           "WHERE sa.collaborator.id = :collaboratorId AND sa.isActive = true")
    List<SupervisorAssignment> findActiveByCollaboratorId(@Param("collaboratorId") UUID collaboratorId);

    @Query("SELECT sa FROM SupervisorAssignment sa " +
           "WHERE sa.supervisor.id = :supervisorId " +
           "AND sa.collaborator.id = :collaboratorId " +
           "AND sa.isActive = true")
    Optional<SupervisorAssignment> findActiveAssignment(
            @Param("supervisorId") UUID supervisorId,
            @Param("collaboratorId") UUID collaboratorId);

    @Query("SELECT sa.collaborator.id FROM SupervisorAssignment sa " +
           "WHERE sa.supervisor.id = :supervisorId AND sa.isActive = true")
    List<UUID> findCollaboratorIdsBySupervisorId(@Param("supervisorId") UUID supervisorId);

    @Query("SELECT COUNT(sa) FROM SupervisorAssignment sa " +
           "WHERE sa.supervisor.id = :supervisorId AND sa.isActive = true")
    long countActiveBySupervisorId(@Param("supervisorId") UUID supervisorId);

    boolean existsBySupervisorIdAndCollaboratorIdAndIsActiveTrue(UUID supervisorId, UUID collaboratorId);
}
