package com.opticrm.core.project.service;

import com.opticrm.common.exception.ResourceNotFoundException;
import com.opticrm.core.account.entity.Account;
import com.opticrm.core.account.repository.AccountRepository;
import com.opticrm.core.opportunity.entity.Opportunity;
import com.opticrm.core.opportunity.repository.OpportunityRepository;
import com.opticrm.core.project.dto.*;
import com.opticrm.core.project.entity.*;
import com.opticrm.core.project.repository.*;
import com.opticrm.security.entity.User;
import com.opticrm.security.repository.UserRepository;
import com.opticrm.security.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final TaskRepository taskRepository;
    private final AccountRepository accountRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;
    private final SecurityService securityService;

    // ── Lecture ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ProjectListDto> findAll(Project.ProjectStatus status, UUID accountId, UUID managerId,
                                        String search, Pageable pageable) {
        Page<Project> page;
        if (search != null && !search.isBlank()) {
            page = projectRepository.search(search.trim(), pageable);
        } else {
            page = projectRepository.findWithFilters(status, accountId, managerId, pageable);
        }
        return page.map(this::toListDto);
    }

    @Transactional(readOnly = true)
    public ProjectDto findById(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));
        return toDto(project);
    }

    // ── Écriture ───────────────────────────────────────────────────────────

    public ProjectDto create(CreateProjectRequest req) {
        User currentUser = securityService.getCurrentUser();
        String reference = generateReference();

        Project project = Project.builder()
                .reference(reference)
                .name(req.getName())
                .description(req.getDescription())
                .status(Project.ProjectStatus.DRAFT)
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .budget(req.getBudget())
                .createdBy(currentUser)
                .build();

        applyRelations(project, req.getAccountId(), req.getOpportunityId(), req.getManagerId());
        project = projectRepository.save(project);

        // Auto-ajouter le manager comme membre CHEF
        if (project.getManager() != null) {
            addMemberInternal(project, project.getManager(), ProjectMember.MemberRole.CHEF);
        }

        return toDto(project);
    }

    public ProjectDto update(UUID id, UpdateProjectRequest req) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));

        project.setName(req.getName());
        project.setDescription(req.getDescription());
        if (req.getStatus() != null) project.setStatus(req.getStatus());
        project.setStartDate(req.getStartDate());
        project.setEndDate(req.getEndDate());
        project.setBudget(req.getBudget());

        applyRelations(project, req.getAccountId(), req.getOpportunityId(), req.getManagerId());
        project = projectRepository.save(project);
        return toDto(project);
    }

    public void delete(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));
        projectRepository.delete(project);
    }

    // ── Membres ────────────────────────────────────────────────────────────

    public ProjectDto addMember(UUID projectId, UUID userId, ProjectMember.MemberRole role) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        boolean exists = project.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(userId));
        if (!exists) {
            addMemberInternal(project, user, role != null ? role : ProjectMember.MemberRole.MEMBRE);
        }
        return toDto(project);
    }

    public void removeMember(UUID projectId, UUID userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));
        project.getMembers().removeIf(m -> m.getUser().getId().equals(userId));
        projectRepository.save(project);
    }

    // ── Milestones ─────────────────────────────────────────────────────────

    public MilestoneDto createMilestone(UUID projectId, CreateMilestoneRequest req) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));

        Milestone milestone = Milestone.builder()
                .project(project)
                .name(req.getName())
                .description(req.getDescription())
                .dueDate(req.getDueDate())
                .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0)
                .build();

        milestone = milestoneRepository.save(milestone);
        return toMilestoneDto(milestone);
    }

    public MilestoneDto updateMilestone(UUID milestoneId, CreateMilestoneRequest req) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone non trouvé"));
        milestone.setName(req.getName());
        milestone.setDescription(req.getDescription());
        milestone.setDueDate(req.getDueDate());
        if (req.getSortOrder() != null) milestone.setSortOrder(req.getSortOrder());
        milestone = milestoneRepository.save(milestone);
        return toMilestoneDto(milestone);
    }

    public void deleteMilestone(UUID milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone non trouvé"));
        milestoneRepository.delete(milestone);
    }

    // ── Progress recalcul ──────────────────────────────────────────────────

    public void recalculateProgress(UUID projectId) {
        int total = taskRepository.countByProjectId(projectId);
        int done = taskRepository.countByProjectIdAndStatus(projectId, Task.TaskStatus.FAIT);
        int pct = total == 0 ? 0 : (done * 100 / total);
        projectRepository.findById(projectId).ifPresent(p -> {
            p.setProgressPct(pct);
            projectRepository.save(p);
        });
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private void applyRelations(Project p, UUID accountId, UUID opportunityId, UUID managerId) {
        p.setAccount(accountId != null
                ? accountRepository.findById(accountId).orElseThrow(() -> new ResourceNotFoundException("Compte non trouvé"))
                : null);
        p.setOpportunity(opportunityId != null
                ? opportunityRepository.findById(opportunityId).orElseThrow(() -> new ResourceNotFoundException("Opportunité non trouvée"))
                : null);
        p.setManager(managerId != null
                ? userRepository.findById(managerId).orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"))
                : null);
    }

    private void addMemberInternal(Project project, User user, ProjectMember.MemberRole role) {
        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(user)
                .role(role)
                .build();
        project.getMembers().add(member);
        projectRepository.save(project);
    }

    private String generateReference() {
        Integer max = projectRepository.findMaxProjectNumber();
        int next = (max != null ? max : 0) + 1;
        return String.format("PRJ-%05d", next);
    }

    private ProjectDto toDto(Project p) {
        List<MilestoneDto> milestones = milestoneRepository.findByProjectIdOrderBySortOrderAsc(p.getId())
                .stream().map(this::toMilestoneDto).toList();

        List<ProjectDto.MemberDto> members = p.getMembers().stream()
                .map(m -> ProjectDto.MemberDto.builder()
                        .userId(m.getUser().getId())
                        .fullName(m.getUser().getFullName())
                        .email(m.getUser().getEmail())
                        .role(m.getRole().name())
                        .build())
                .toList();

        return ProjectDto.builder()
                .id(p.getId())
                .reference(p.getReference())
                .name(p.getName())
                .description(p.getDescription())
                .status(p.getStatus())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .budget(p.getBudget())
                .progressPct(p.getProgressPct())
                .account(p.getAccount() != null ? ProjectDto.RelatedDto.builder()
                        .id(p.getAccount().getId()).name(p.getAccount().getName()).build() : null)
                .opportunity(p.getOpportunity() != null ? ProjectDto.RelatedDto.builder()
                        .id(p.getOpportunity().getId()).name(p.getOpportunity().getName()).build() : null)
                .manager(p.getManager() != null ? ProjectDto.UserSummaryDto.builder()
                        .id(p.getManager().getId())
                        .fullName(p.getManager().getFullName())
                        .email(p.getManager().getEmail()).build() : null)
                .createdBy(p.getCreatedBy() != null ? ProjectDto.UserSummaryDto.builder()
                        .id(p.getCreatedBy().getId())
                        .fullName(p.getCreatedBy().getFullName())
                        .email(p.getCreatedBy().getEmail()).build() : null)
                .members(members)
                .milestones(milestones)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private ProjectListDto toListDto(Project p) {
        return ProjectListDto.builder()
                .id(p.getId())
                .reference(p.getReference())
                .name(p.getName())
                .status(p.getStatus())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .progressPct(p.getProgressPct())
                .budget(p.getBudget())
                .accountId(p.getAccount() != null ? p.getAccount().getId() : null)
                .accountName(p.getAccount() != null ? p.getAccount().getName() : null)
                .managerId(p.getManager() != null ? p.getManager().getId() : null)
                .managerName(p.getManager() != null ? p.getManager().getFullName() : null)
                .taskCount(taskRepository.countByProjectId(p.getId()))
                .memberCount(p.getMembers().size())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private MilestoneDto toMilestoneDto(Milestone m) {
        return MilestoneDto.builder()
                .id(m.getId())
                .name(m.getName())
                .description(m.getDescription())
                .dueDate(m.getDueDate())
                .status(m.getStatus())
                .sortOrder(m.getSortOrder())
                .taskCount(taskRepository.countByProjectId(m.getProject().getId()))
                .build();
    }
}
