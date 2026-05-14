package com.opticrm.reporting.service;

import com.opticrm.reporting.dto.AssignCollaboratorRequest;
import com.opticrm.reporting.dto.CollaboratorSummaryDto;
import com.opticrm.reporting.dto.SupervisorAssignmentDto;
import com.opticrm.security.entity.SupervisorAssignment;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.SupervisorAssignmentRepository;
import com.opticrm.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupervisorAssignmentService {

    private final SupervisorAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;

    private static final Set<String> ASSIGNABLE_ROLES = Set.of("COMMERCIAL", "READ_ONLY");

    @Transactional(readOnly = true)
    public List<SupervisorAssignmentDto> getMyCollaborators(UUID supervisorId) {
        return assignmentRepository.findActiveBySupervisorId(supervisorId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UUID> getCollaboratorIds(UUID supervisorId) {
        return assignmentRepository.findCollaboratorIdsBySupervisorId(supervisorId);
    }

    @Transactional
    public SupervisorAssignmentDto assignCollaborator(UUID supervisorId, AssignCollaboratorRequest request, UUID assignedById) {
        UUID collaboratorId = request.getCollaboratorId();

        if (supervisorId.equals(collaboratorId)) {
            throw new IllegalArgumentException("Un superviseur ne peut pas s'assigner lui-même");
        }

        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new NoSuchElementException("Superviseur introuvable"));

        User collaborator = userRepository.findById(collaboratorId)
                .orElseThrow(() -> new NoSuchElementException("Collaborateur introuvable: " + collaboratorId));

        if (!collaborator.getIsActive()) {
            throw new IllegalArgumentException("Le collaborateur est désactivé");
        }

        if (assignmentRepository.existsBySupervisorIdAndCollaboratorIdAndIsActiveTrue(supervisorId, collaboratorId)) {
            throw new IllegalArgumentException("Ce collaborateur est déjà assigné à ce superviseur");
        }

        SupervisorAssignment assignment = SupervisorAssignment.builder()
                .supervisor(supervisor)
                .collaborator(collaborator)
                .notes(request.getNotes())
                .build();

        if (assignedById != null) {
            userRepository.findById(assignedById).ifPresent(assignment::setAssignedBy);
        }

        assignment = assignmentRepository.save(assignment);
        log.info("Collaborator {} assigned to supervisor {} by {}", collaboratorId, supervisorId, assignedById);

        return toDto(assignment);
    }

    @Transactional
    public void unassignCollaborator(UUID supervisorId, UUID collaboratorId) {
        SupervisorAssignment assignment = assignmentRepository
                .findActiveAssignment(supervisorId, collaboratorId)
                .orElseThrow(() -> new NoSuchElementException("Affectation introuvable"));

        assignment.deactivate();
        assignmentRepository.save(assignment);
        log.info("Collaborator {} unassigned from supervisor {}", collaboratorId, supervisorId);
    }

    @Transactional(readOnly = true)
    public List<CollaboratorSummaryDto> getAssignableUsers(UUID supervisorId) {
        List<User> allActive = userRepository.findAllActive();
        Set<UUID> alreadyAssigned = new HashSet<>(
                assignmentRepository.findCollaboratorIdsBySupervisorId(supervisorId));

        return allActive.stream()
                .filter(u -> !u.getId().equals(supervisorId))
                .filter(u -> u.getRole() != null)
                .sorted(Comparator.comparing(User::getFullName))
                .map(u -> CollaboratorSummaryDto.builder()
                        .userId(u.getId())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .role(u.getRole().getName())
                        .alreadyAssigned(alreadyAssigned.contains(u.getId()))
                        .build())
                .collect(Collectors.toList());
    }

    private SupervisorAssignmentDto toDto(SupervisorAssignment sa) {
        User collab = sa.getCollaborator();
        User sup = sa.getSupervisor();
        return SupervisorAssignmentDto.builder()
                .id(sa.getId())
                .supervisorId(sup.getId())
                .supervisorName(sup.getFullName())
                .collaboratorId(collab.getId())
                .collaboratorName(collab.getFullName())
                .collaboratorEmail(collab.getEmail())
                .collaboratorRole(collab.getRole() != null ? collab.getRole().getName() : null)
                .assignedAt(sa.getAssignedAt())
                .notes(sa.getNotes())
                .active(Boolean.TRUE.equals(sa.getIsActive()))
                .build();
    }
}
